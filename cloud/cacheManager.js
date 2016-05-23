module.exports = {
    addFixture: addFixture,
    addFixturesToIdMap: addFixturesToIdMap
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

function addFixture(fixture) {
    addFixtureToGameweek(fixture);
    addFixtureToIdMap(fixture)
}

function addFixtureToGameweek (fixture) {
    var gw = fixture.get('gameweek');
    var cached = cache.get('fixture_' + gw);
    if (cached) {
        var length = cached.length;
        for (var i = 0; i < length; i++) {
            if (cached[i].id === fixture.id) {
                cached[i] = fixture;
                cache.put('fixture_' + gw, cached);
                continue;
            }
        }
    }
}

function addFixtureToIdMap (fixture) {
    var pseudoId = fixture.get('pseudoId');
    cache.del('f_' + pseudoId);
    cache.put('f_' + pseudoId, fixture);
}

function addFixturesToIdMap (fixtures) {
    var length = fixtures.length;
    for (var i = 0; i < length; i++) {
        addFixtureToIdMap(fixtures[i])
    }
}