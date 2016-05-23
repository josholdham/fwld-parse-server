module.exports = {
    createWeeklyTotals : createWeeklyTotals,
    removeWeeklyTotals : destroyWeeklyTotals,
    bulkUpdateFixtures : bulkUpdateFixtures
};

var totals = require('./totals');

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

function destroyWeeklyTotals(req, res) {
    console.log('destroyWeeklyTotals')
    var gw = parseInt(req.params.gameweek, 10);

    totals.getWeeklyTotals([], gw, true).then(function(totals) {
        return Parse.Object.destroyAll(totals);
    }).then(function() {
        res.success("")
    }, function(err){
        res.error(err)
    });
}

function createWeeklyTotals(req, res) {
    var gw = parseInt(req.params.gameweek, 10);

    totals.getWeeklyTotals([], gw, true).then(function(totals) {
        return Parse.Object.destroyAll(totals);
    }).then(function() {
        return getFixturesForGameweek(gw)
    }).then(function(fixtures) {
        console.log(fixtures);
        for (var i = 0 ; i < fixtures.length; i++) {
            totals.processFixture(fixtures[i])
        }
        res.success("")
    })
}

function getFixturesForGameweek(gw) {
    var query = new Parse.Query('Fixture');
    query.equalTo('gameweek', gw);
    query.notEqualTo('deleted', true);
    return query.find()
}

function bulkUpdateFixtures(req, res) {
    var gw = parseInt(req.params.gameweek, 10);
    var query = new Parse.Query('Fixture');
    query.equalTo('gameweek', gw);
    query.notEqualTo('deleted', true);
    query.find().then(function(fixtures) {
        console.log(fixtures);
        var length = fixtures.length;
        var promises = [];
        for(var i = 0; i < length; i ++) {
            fixtures[i].set(req.params.pKey, req.params.pValue);
            promises.push(fixtures[i].save())
        }

        Parse.Promise.when(promises).then(function() {
            res.success("")
        }, function(err) {
            res.error(err)
        })
    })
}