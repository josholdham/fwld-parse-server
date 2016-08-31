module.exports = {
    getFixtures : getFixtures,
    returnFixtures : returnFixtures,
    queryFixtures : queryFixtures
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

function getFixtures(req, res) {
    var gw = req.params.gw;

    returnFixtures(gw).then(function(fixtures) {
        res.success(fixtures)
    }, function(err) {
        res.error(err)
    })
}

function returnFixtures(gw) {
    var cached = cache.get('fixture_' + gw);
    if (cached) {
        return cached;
    }
    else {
        console.log('not cached')
        return queryFixtures(gw)
    }
}

function queryFixtures(gw) {
    var query = new Parse.Query('Fixture');
    query.equalTo('gameweek', gw);
    query.notEqualTo('deleted', true);
    return query.find();
}