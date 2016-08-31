var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');

var cacheManager = require('../cacheManager');
var errors = require('../errors');
var IMP = require('./generic').IMP;
var _maps = require('./generic')._maps;

var yahoo = {};
yahoo._GET = {};
yahoo.HELPERS = {};
yahoo.PROCESS = {};

yahoo._GET.scores = function(req, res) {
    url = 'https://sports.yahoo.com/soccer/premier-league/scoreboard/'

    request(url, function(error, response, html) {
        if (error) {
            //res.error(error)
            return false; //xyz does this report down the the failed promise
        }
        var $ = cheerio.load(html);
        yahoo.HELPERS.extractFixtureIds($).then(function(pseudoIds) {
            return IMP.generic.returnFixtures({'pseudoIds' : pseudoIds})
        }).then(function(data) {
            return IMP.generic.organiseFixtures(data);
        }).then(function(organisedIds) {
            return yahoo.PROCESS.results($, organisedIds);
        }).then(function(promises) {
            return Parse.Promise.when(promises)
        }).then(function(data) {
            res.success()
        }, function(err) {
            errors.reportError('import.js', 'checkScores', 'in the checkScores promise chain', err);
            res.error(err);
        })
    })
}

yahoo.HELPERS.extractFixtureIds = function($) {
    var ids = [];
    $('table.list').children('tbody').children('.game').each(function(i, elem) {
        var home = $(this).children('.away').children('.team').children('em').html();
        var away = $(this).children('.home').children('.team').children('em').html();
        var homeCode = _maps.yahoo[home].code;
        var awayCode = _maps.yahoo[away].code;
        var pseudoId = homeCode+awayCode;
        ids.push(pseudoId);
    })
    return Promise.resolve(ids);
}

yahoo.PROCESS.results = function($, organisedIds) {
    console.log('do we see the $ here?'); //xyz
    console.log($);
    var promises = [];

    $('table.list').children('tbody').children('.game').each(function(i, elem) {
        var home = $(this).children('.away').children('.team').children('em').html();
        var away = $(this).children('.home').children('.team').children('em').html();
        var homeCode = _maps.yahoo[home].code;
        var awayCode = _maps.yahoo[away].code;
        var pseudoId = homeCode+awayCode;

        if (organisedIds[pseudoId]) {
            var changed = false;
            var fixture = organisedIds[pseudoId] || null;

            var homeRaw = $(this).children('.score').children('.vs').children('a').children('.away').html();
            var homeScore = homeRaw ? parseInt(homeRaw) : null;
            var awayRaw = $(this).children('.score').children('.vs').children('a').children('.home').html();
            var awayScore = awayRaw ? parseInt(awayRaw) : null;

            var details =  $(this).children('.details').children('span').html();
            if (details === 'Full Time') {
                if (fixture.get('status') !== 'FINISHED') {
                    fixture.set('status', 'FINISHED');

                    fixture.set('score', homeScore + ' - ' + awayScore);

                    if(homeScore === awayScore) {
                        fixture.set('result', 'draw');
                    }
                    else if(homeScore  > awayScore) {
                        fixture.set('result', 'home');
                    }
                    else if(homeScore  < awayScore){
                        fixture.set('result', 'away');
                    }
                    changed = true;
                }
            }
            if (fixture.get('homeScore') !== homeScore) {
                changed = true;
                fixture.set('homeScore', homeScore);
                fixture.set('score', homeScore + ' - ' + awayScore);
            }

            if (fixture.get('awayScore') !== awayScore) {
                changed = true;
                fixture.set('awayScore', awayScore);
                fixture.set('score', homeScore + ' - ' + awayScore);
            }

            // Do we need to save this record
            if (changed) {
                promises.push(fixture.save())
            }
        }
        else {
            //we don't have this fixture, which is a slight concern
        }
    });

    return promises
}

module.exports = {
    updateScores : yahoo._GET.scores
};