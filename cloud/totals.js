module.exports = {
    processFixture : processFixture,
    getWeeklyTotals : getWeeklyTotals
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

var processing = false;
var queuedFixtures = [];

function processFixture(fixture, recursing) {
    if (processing && !recursing) {
        console.log("[TOTALS - processFixture] - QUEUE FIXTURE")
        queuedFixtures.push(fixture);
        return false;
    }

    console.log("[TOTALS - processFixture] - started processing "+fixture.id)
    processing = true;

    var gw = fixture.get('gameweek');
    var result = fixture.get('result'); //xyz check this field
    var organisedWeeklyTotals = {};
    var retrievedPredictions = [];

    // Get predictions for this fixture
    var query = new Parse.Query('Prediction');
    query.notEqualTo('deleted', true);
    query.equalTo('fixtureId', fixture.id);
    query.descending('createdAt');
    query.limit(1000); //xyz - monitor this
    query.find().then(function(predictions) {
        console.log(predictions.length)
        retrievedPredictions = predictions;
        var userIds = [];
        var length = predictions.length;
        for (var i = 0; i < length; i++) {
            userIds.push(predictions[i].get('userId'))
        }
        return getWeeklyTotals(userIds, gw);
    }).then(function(weeklyTotals) {
        organisedWeeklyTotals = {};
        var length = weeklyTotals.length;
        for (var i=0; i < length; i++) {
            var userId = weeklyTotals[i].get('userId');
            organisedWeeklyTotals[userId] = weeklyTotals[i];
        }
        return createWeeklyTotalsObjects(retrievedPredictions, organisedWeeklyTotals, fixture);
    }).then(function(promises) {
        Parse.Promise.when(promises).then(function() {
            console.log("[TOTALS - processFixture] - promises completed")
            if (queuedFixtures.length > 0) {
                console.log("[TOTALS - processFixture] - about to loop pre"+queuedFixtures.length)
                var item = queuedFixtures.shift();
                console.log("[TOTALS - processFixture] - about to loop post"+queuedFixtures.length)
                processFixture(item, true)
            }
            else {
                processing = false;
            }
        }, function(err) {
            console.log('error saving weekly totals')
            console.log(err)
        })
    }, function(err) {
        console.log('error in the promise chain saving weekly totals')
        console.log(err)
    })
}

function getWeeklyTotals(userIds, gw, allUsers) {
    var query = new Parse.Query('WeeklyTotal');
    query.equalTo('gameweek', gw);
    if (!allUsers) {
        query.containedIn('userId', userIds);
    }
    query.notEqualTo('deleted', true);
    query.limit(1000); //xyz - monitor this
    return query.find();
}

function createWeeklyTotalsObjects(predictions, organisedWeeklyTotals, fixture) {
    var promises = [];
    var gw = fixture.get('gameweek');
    var result = fixture.get('result'); //xyz check this field
    var checkUsers = [];
    var length = predictions.length;
    for (var i = 0; i < length; i++) { //for each prediction
        var prediction = predictions[i]
        var userId = predictions[i].get('userId');
        if(checkUsers.indexOf(userId) > -1) {
            // we have already checked prediction for this user, so exit
            continue;
        }
        checkUsers.push(userId)

        if (organisedWeeklyTotals[userId]) {
            var weeklyTotal = organisedWeeklyTotals[userId];
        }
        else {
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
            weeklyTotal.set('user', predictions[i].get('user'));
        }

        var fixturesAlreadyCounted = weeklyTotal.get('fixtureIds');
        if (fixturesAlreadyCounted.indexOf(fixture.id) > -1) {
            // we already have this fixture recorded for this user, so skip
            continue;
        }

        // xyz - what if they have a special multiplier for this gameweek?
        var predicted = prediction.get('predicted');
        if (predicted === result) {
            // Prediction was correct
            var odds = parseInt(fixture.get(predicted+'Odds'), 10);
            var oddsAtPrediction = parseInt(predictions[i].get('predictedOdds'), 10);
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
        }
        else {
            // Prediction was incorrect
            var odds = parseInt(fixture.get(predicted+'Odds'), 10);
            var oddsAtPrediction = parseInt(predictions[i].get('predictedOdds'), 10);
            var obj = {
                'fixtureId': fixture.id,
                'predicted': predicted,
                'odds': odds,
                'predictedOdds' : oddsAtPrediction, //xyz parseInt
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

        weeklyTotal.add('fixtures', fixture);
        weeklyTotal.add('fixtureIds', fixture.id);
        promises.push(weeklyTotal.save())
    } //for

    return promises
}