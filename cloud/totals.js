var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

var errors = {};

var fixtures = require('./fixtures');
var errors = require('./errors');
var cacheManager = require('./cacheManager');

var LIMITER = 1000;

var wts = {
    DATA: {
        'processing' : false,
        'queuedFixtures' : [],
        'predictions' : null,
        'usersWithPredictions' : null,
        'weeklyTotals' : null
    },
    QUERIES: {},
    ORGANISE: {},
    PROCESS: {},
    HELPERS: {},
    RESET: {
        wtData: function(hard) {
            wts.DATA.predictions = null;
            wts.DATA.usersWithPredictions = null;
            wts.DATA.weeklyTotals = null;

            if (hard) {
                wts.DATA.processing = false;
                wts.DATA.queuedFixtures = [];
            }
        }
    }
}
wts.RESET.wtData(true);

//  P R O C E S S    F I X T U R E
//
//  This handles a completed fixture.
//  It finds predictions made on this fixture
//  It gets the weekly totals records for users with predictions 
//      (if there aren't any, it creates them)
//  It updates these records based on the new ficture, and whether the prediction was correct
//  It saves these weekly total records
//  If any other fixtures are queued to be processed, it will recurse to process them
//
// [called from fixture beforeSave, if the status has been changed to FINISHED]
//      [can also be called manually to test]
wts.processFixture = function(fixture, recursing) {
    // Handle queueing
    if (wts.DATA.processing && !recursing) {
        console.log("[TOTALS - processFixture] - QUEUE FIXTURE")
        wts.DATA.queuedFixtures.push(fixture);
        return false;
    }
    wts.DATA.processing = true;

    // Process the fixture
    wts.QUERIES.predictions(fixture).then(function(predictions) {
        wts.DATA.predictions = predictions;
        return wts.ORGANISE.usersWithPredictions();
    }).then(function(userIds){
        wts.DATA.usersWithPredictions = userIds;
        return wts.QUERIES.weeklyTotals(userIds, fixture);        
    }).then(function(weeklyTotals) {
        return wts.ORGANISE.weeklyTotals(weeklyTotals);
    }).then(function(weeklyTotals) {
        wts.DATA.weeklyTotals = weeklyTotals;    
        return wts.PROCESS.addOrUpdateWeeklyTotals(fixture);
    }).then(function(promises) {
        return Parse.Promise.when(promises);
    }).then(function(results) {
        wts.PROCESS.updateFixtureProcessingStatus(fixture, 'completed')
        console.log("[TOTALS - processFixture] - promises completed");
        wts.RESET.wtData();
        if (queuedFixtures.length > 0) {
            var item = queuedFixtures.shift();
            processFixture(item, true)
        }
        else {
            processing = false;
        }
    }, function(err) {
        errors.reportError('totals.js', 'processFixture', 'in the processFixture promise chain', err);
        wts.PROCESS.updateFixtureProcessingStatus(fixture, 'error')
    })
}

wts.QUERIES.predictions = function(fixture) {
    var query = new Parse.Query('Prediction');
    query.notEqualTo('deleted', true);
    query.equalTo('fixtureId', fixture.id);
    query.descending('createdAt');
    query.limit(LIMITER);
    return query.find()
}

wts.ORGANISE.usersWithPredictions = function() {
    var userIds = [];
    var predictions = wts.DATA.predictions;
    var length = predictions.length;
    for (var i = 0; i < length; i++) {
        userIds.push(predictions[i].get('userId') || 'test')
    }
    return userIds;
}

wts.QUERIES.weeklyTotals = function(userIds, fixture) {
    var gw = fixture.get('gameweek');
    var query = new Parse.Query('WeeklyTotal');
    query.equalTo('gameweek', gw);
    if (userIds) {
        query.containedIn('userId', userIds);
    }
    query.notEqualTo('deleted', true);
    query.limit(LIMITER);
    return query.find();
}

wts.ORGANISE.weeklyTotals = function(weeklyTotals) {
    organisedWeeklyTotals = {};
    var length = weeklyTotals.length;
    for (var i=0; i < length; i++) {
        var userId = weeklyTotals[i].get('userId') || 'test';
        organisedWeeklyTotals[userId] = weeklyTotals[i];
    }
    return organisedWeeklyTotals;
}

wts.PROCESS.addOrUpdateWeeklyTotals = function(fixture) {
    var predictions = wts.DATA.predictions;

    var promises = [];
    var length = predictions.length;
    for (var i = 0; i < length; i++) { //for each prediction

        var weeklyTotal = wts.PROCESS.prediction(fixture, prediction);

        if (weeklyTotal) {
            var fixturePointer = {
                __type: "Pointer",
                className: "Fixture",
                objectId: fixture.id
            }

            weeklyTotal.add('fixtures', fixturePointer);
            weeklyTotal.add('fixtureIds', fixture.id);
            promises.push(weeklyTotal.save())
        }
    } //for

    return promises
}

wts.PROCESS.prediction = function(fixture, prediction) {
    var organisedWeeklyTotals = wts.DATA.weeklyTotals;
    var gw = fixture.get('gameweek');
    var result = fixture.get('result');
    var userId = prediction.get('userId') || 'test';

    // Get or create weekly total object for this user
    if (organisedWeeklyTotals[userId]) {
        var weeklyTotal = organisedWeeklyTotals[userId];
    }
    else {
        var weeklyTotal = wts.HELPERS.createNewWeeklyTotalsObject(gw, userId, prediction);
    }

    // VALIDATION 
    if (wts.HELPERS.validatePrediction()) {
        return false; //xyz what happens here
    }

    // PROCESS - points based on prediction/result
    var predicted = prediction.get('predicted');
    if (predicted === result) {
        // Prediction was correct
        weeklyTotal = wts.PROCESS.correctPrediction(fixture, predicted, prediction, weeklyTotal);
    }
    else {
        // Prediction was incorrect
        weeklyTotal = wts.PROCESS.incorrectPrediction(fixture, predicted, prediction, weeklyTotal);
    }

    return weeklyTotal;
}

wts.HELPERS.validatePrediction = function(prediction, fixture, weeklyTotal) {
    var shouldContinue = false;
    // VALIDATE - has this user already made a prediction for this fixture?
    var fixturesAlreadyCounted = weeklyTotal.get('fixtureIds');
    if (fixturesAlreadyCounted.indexOf(fixture.id) > -1) {
        shouldContinue = true;
    }

    // VALIDATE - was the prediction made or changed after the fixture started
    var predictionDate = prediction.updatedAt;
    var kickoff = fixture.get('kickoff'); //xyz - check
    if (predictionDate > kickoff) {
        shouldContinue = true;
    }

    return shouldContinue;
}

wts.PROCESS.correctPrediction = function(fixture, predicted, prediction, weeklyTotal) {
    var odds = parseInt(fixture.get(predicted+'Odds'), 10);
    var oddsAtPrediction = parseInt(prediction.get('predictedOdds'), 10);
    var obj = {
        'fixtureId': fixture.id,
        'predicted': predicted,
        'odds': odds,
        'predictedOdds' : oddsAtPrediction, //xyz parseInt
        'points': odds
    }

    weeklyTotal.add('fixturesWon', obj);

    var existingPoints = weeklyTotal.get('points');
    var newPoints = existingPoints + odds;
    weeklyTotal.set('points', newPoints);

    var existingPointsMade = weeklyTotal.get('pointsGained');
    var newPointsMade = existingPointsMade + odds;
    weeklyTotal.set('pointsGained', newPointsMade);

    var existingPointsAtPrediction = weeklyTotal.get('pointsAtPrediction');
    var newPointsAtPrediction = existingPointsAtPrediction + oddsAtPrediction;
    weeklyTotal.set('pointsAtPrediction', newPointsAtPrediction);

    var existingPointsAtPredictionGained = weeklyTotal.get('pointsAtPredictionGained');
    var newPointsAtPredictionGained = existingPointsAtPredictionGained + oddsAtPrediction;
    weeklyTotal.set('pointsAtPredictionGained', newPointsAtPredictionGained);

    return weeklyTotal;
}

wts.PROCESS.incorrectPrediction = function(fixture, predicted, prediction, weeklyTotal) {
    var odds = parseInt(fixture.get(predicted+'Odds'), 10);
    var oddsAtPrediction = parseInt(prediction.get('predictedOdds'), 10);
    var obj = {
        'fixtureId': fixture.id,
        'predicted': predicted,
        'odds': odds,
        'predictedOdds' : oddsAtPrediction,
        'points': -10
    }

    weeklyTotal.add('fixturesLost', obj);

    var existingPoints = weeklyTotal.get('points');
    var newPoints = existingPoints - 10;
    weeklyTotal.set('points', newPoints);

    var existingPointsLost = weeklyTotal.get('pointsLost');
    var newPointsLost = existingPointsLost -10;
    weeklyTotal.set('pointsLost', newPointsLost);

    var existingPointsAtPrediction = weeklyTotal.get('pointsAtPrediction');
    var newPointsAtPrediction = existingPointsAtPrediction - 10;
    weeklyTotal.set('pointsAtPrediction', newPointsAtPrediction);
}

wts.HELPERS.createNewWeeklyTotalsObject = function(gw, userId, prediction) {
    var WeeklyTotal = Parse.Object.extend('WeeklyTotal');
    var weeklyTotal = new WeeklyTotal();
    weeklyTotal.set('gameweek', gw);
    weeklyTotal.set('fixtures', []);
    weeklyTotal.set('fixtureIds', []);
    weeklyTotal.set('points', 0);
    weeklyTotal.set('pointsGained', 0);
    weeklyTotal.set('pointsLost', 0);
    weeklyTotal.set('pointsAtPrediction', 0);
    weeklyTotal.set('pointsAtPredictionGained', 0);
    weeklyTotal.set('fixturesWon', []);
    weeklyTotal.set('fixturesLost', []);
    weeklyTotal.set('userId', userId);
    if (prediction.get('user')) {
        weeklyTotal.set('user', prediction.get('user') || null);
    }
    return weeklyTotal;
}

wts.PROCESS.updateFixtureProcessingStatus = function(fixture, status) {
    fixture.set('processed', status);
    fixture.save();
    cacheManager.addFixture(fixture);
}

//
//
//
//  T O T A L S
//
//
//

// function checkIfGameweekIsComplete(fixture) {
//     var gw = fixture.get('gameweek');
//     // 1. look to see if there are any queued items for this gameweek
//     var length = queuedFixtures.length;
//     for (var i=0; i < length; i++) {
//         if (queuedFixtures[i].get('gameweek') === gw) {
//             return false //xyz we can stop here
//         }
//     }
//     // 2. look to see if there are any errors for this gameweek
//     if (errors[gw]) {
//         return false; //xyz we can stop here
//     }

//     // 3. if neither, then query fixtures for this gameweek
//     fixtures.returnFixtures(gw).then(function(data) {
//         var length = data.length;
//         for (var i = 0; i < length; i++) {
//             if (data[i].get('processed') !== 'completed') {
//                 return false; //xyz we can stop here
//             }
//         }

//         // 4. if they are all successful (in terms of weekly total, then we can trigger the
//         //     updating of broader totals)
//         return updateTotals(gw);
//     })
// }

// function updateTotals(gw) {
//     // Get all weekly totals
//     var weeklyTotals = [];
//     var existingTotals = {};

//     getWeeklyTotals(null, gw, true).then(function(data) {
//         weeklyTotals = data;
//         var userIds = [];
//         var length = weeklyTotals.length;
//         for (var i = 0; i < length; i++) {
//             var userId = weeklyTotals[i].get('userId');
//             userIds.push(userId);
//         }
//         return getExistingTotals(userIds, gw, false)
//     }).then(function(totals) {
//         // Organise totals by userId
//         var length = totals.length;
//         for (var i=0; i < length; i++) {
//             var userId = totals[i].get('userId') || 'test';
//             existingTotals[userId] = totals[i];
//         }

//         return updateTotalsObjects()
//     }).then(function(promises) {

//     })
// }

// function getExistingTotals(userIds, gw, allUsers) {
//     var query = new Parse.Query('Total');
//     if (!allUsers) {
//         query.containedIn('userId', userIds);
//     }
//     query.notEqualTo('deleted', true);
//     query.limit(1000); //xyz - monitor this
//     return query.find();
// }


// function updateTotalsObjects(weeklyTotals, existingTotals) {
//     var promises = [];

//     var length = weeklyTotals.length;
//     for (var i = 0; i < length; i++) {
//         var userId = weeklyTotals[i].get('userId');
//         var total = null;

//         if (existingTotals[userId]) {
//             total = existingTotals[userId];
//         }
//         else {
//             total = createNewTotalObject(weeklyTotals[i])
//         }

//         if (!total) { continue; }

//         // Update the total with new weekly total information
//         total = updateTotalObject(total);
//         promises.push(total.save());
//     }
// }

// function createNewTotalObject(weeklyTotal) {
//     if (!weeklyTotal.get('user')) {
//         return false
//     }

//     var Total = Parse.Object.extend('Total');
//     var total = new Total();
//     var gw = weeklyTotal.get('gameweek')

//     total.set('user', weeklyTotal.get('user'));
//     total.set('userId', weeklyTotal.get('userId'));
//     total.set('userStarted', gw);
//     total.set('w' + gw, weeklyTotal);
//     total.set('w' + gw + 'points', weeklyTotal.get('points'));
//     total.set('total', 0);
//     total.set('gameweeksPlayed', 0);
//     total.set('fixturesPlayed', 0);
//     total.set('fixturesWon', 0);
//     total.set('fixturesLost', 0);

//     return total;
// }

module.exports = {
    processFixture : wts.processFixture
    //getWeeklyTotals : getWeeklyTotals
};