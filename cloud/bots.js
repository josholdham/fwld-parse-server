module.exports = {

};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

var fixtures = require('../fixtures');

var init = function(req, res) {
    var gw = req.params.gameweek;

    getFixtures(gw).then(function(fixtures) {
        return processFixtures(fixtures)
    })
}

var getFixtures = function(gw) {
    return fixtures.queryFixtures(gw)
}

var processFixtures= function(fixtures) {
    var length = fixtures.length;
    for (var i = 0; i < length; i++) {
        if (fixture[i].get('status') !== 'FINISHED') {
            continue;
        }

        if (fixture.get('result') === 'home') {

        }
        else if (fixture.get('result') === 'away') {
            
        }
        else (fixture.get('result') === 'draw') {
            
        }
    }
}
