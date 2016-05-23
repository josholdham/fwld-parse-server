module.exports = {
    makePrediction : makePrediction,
    deletePrediction : deletePredictions
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

function makePrediction(req, res) {
    console.log('****')
    console.log(req.user)
    if (!req.user) {
        res.error({'code': 399})
    }

    var gw = parseInt(req.params.gw, 10);
    var predicted = req.params.prediction;
    var fixtureId = req.params.fixtureId;

    if (!gw || (gw && isNaN(gw)) || !predicted || !fixtureId) {
        res.error({'code': 401, 'message': 'We did not have enough data to make your prediction'})
    }

    // Get fixture
    returnPredictionFixture(gw, fixtureId).then(function(fixture) {
        var date = fixture.get('date');
        var now = new Date();
        if (now >= date) {
            res.error({'code': 405})
        }
        else {
            var Prediction = Parse.Object.extend('Prediction');
            var prediction = new Prediction();
            prediction.set('fixture', fixture);
            prediction.set('fixtureId', fixture.id);
            prediction.set('gameweek', gw);
            prediction.set('userId', req.user.id);
            prediction.set('user', req.user);
            prediction.set('predicted', predicted);
            var odds = fixture.get(prediction + 'Odds');
            console.log('ODDS at time of prediction: '+odds)
            prediction.set('predictedOdds', odds);
            prediction.save().then(function(prediction) {
                res.success(prediction)
            }, function(err) {
                res.error({'code': 401, 'message': 'Error saving the prediction'})
            })

        }
    }, function(err) {
        res.error({'code': 401, 'message': 'We could not find the fixture you were predicting for'})
    })
}

function returnPredictionFixture(gw, fixtureId) {
    var deferred = q.defer();

    var fixture = null;
    var cached = cache.get('fixture_' + gw);
    if (cached) {
        var length = cached.length;
        for (var i=0; i < length; i++) {
            if (cached[i].id === fixtureId) {
                fixture = cached[i];
                deferred.resolve(fixture)
            }
        }
    }

    if (!fixture) {
        // We should only get here if we don't have a cached fixture
        var query = new Parse.Query('Fixture');
        query.get(fixtureId).then(function(fixture) {
            deferred.resolve(fixture)
        }, function(err) {
            deferred.reject(err);
        })
    }

    return deferred.promise;
}

function deletePredictions(req, res) {
    if (!req.user) {
        res.error({'code': 399})
    }

    var predicted = req.params.prediction;
    var fixtureId = req.params.fixtureId;

    if (!predicted || !fixtureId) {
        res.error({'code': 401, 'message': 'We did not have enough data to delete your prediction'})
    }

    var query = new Parse.Query('Prediction');
    query.equalTo('userId', req.user.id);
    query.equalTo('fixtureId', fixtureId);
    query.equalTo('predicted', predicted);
    query.notEqualTo('deleted', true);
    query.find().then(function(data) {
        console.log('found ' + data.length + 'previous predictions')
        deleteIndividualPrediction(data, req).then(function() {
            console.log("DELETED")
            res.success("")
        }, function(err) {
            res.error("")
        })
    }, function(err) {
        res.error("");
    })
}

function deleteIndividualPrediction(data, req) {
    var length = data.length;
    var promises = [];
    for (var i = 0; i < length; i++) {
        if (req.user.id === data[i].get('userId')) {
            data[i].set('deleted', true);
            console.log('deleting previous prediction')
            promises.push(data[i].save());
        }
    }

    return Parse.Promise.when(promises)
}