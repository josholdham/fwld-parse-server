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

var bf = { 
    _GET : {},
    HELPERS : {},
    VALIDATE : {},
    PROCESS: {},
    DATA: {}
}

bf._GET.scores = function(req, res) {
    var url = 'https://www.betfair.com/exchange/football/competition?id=31'

    request(url, function(error, response, html) {
        if (error) {
            return false;  //xyz does this report down the the failed promise
        }

        var $ = cheerio.load(html);
        bf.HELPERS.extractFixtureIds($).then(function(pseudoIds) {
            console.log('---  1 ----')
            return IMP.generic.returnFixtures({'pseudoIds' : pseudoIds})
        }).then(function(data) {
            console.log('---  2 ----')
            console.log(data);
            return IMP.generic.organiseFixtures(data);
        }).then(function(organisedIds) {
            console.log('---  3 ----')
            bf.DATA.organisedIds = organisedIds;
            console.log(bf.DATA.organisedIds);
            return bf.PROCESS.bfItemsToRawFixtures($, bf.DATA.organisedIds);
        }).then(function(rawFixtures) {
            console.log('---  4 ----')
            console.log(rawFixtures);
            return bf.VALIDATE.fixtures(rawFixtures);
        }).then(function(validatedFixtures) {
            console.log('---  5 ----')
            return bf.PROCESS.createPromises(validatedFixtures, bf.DATA.organisedIds);
        }).then(function(promises) {
            console.log('---  6 ----')
            return Parse.Promise.when(promises);
        }).then(function(promises) {
            console.log('[IMPORT - updateOdds] Promises Completed')
            res.success("");
        }, function(err) {
            console.error('[IMPORT - updateOdds] Error in promise chain');
            console.error(err)
            res.error(err)
        });
    });
}

bf.HELPERS.processDate = function(dateRaw) {
    if (dateRaw === 'Today') {
        var date = new Date();
        date.setHours(0,0,0,0);
    }
    else if (dateRaw === 'Tomorrow') {
        var date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
        date.setHours(0,0,0,0);
    }
    else {
        var date = new Date(dateRaw);
    }
    return date;
}

bf.HELPERS.extractFixtureIds = function($) {
    var ids = [];
    $('.mod-competition-page-coupon').children().each(function(i, elem) {
        $(elem).find('.list-coupons').each(function(i) {
            var home = $(this).find('.home-team').html();
            var away = $(this).find('.away-team').html();
            var awayCode = _maps.betfair[away].code;
            var homeCode = _maps.betfair[home].code;
            var pseudoId = homeCode+awayCode;
            ids.push(pseudoId)
        })
    })
    return Promise.resolve(ids);
}

bf.VALIDATE.fixtures = function(rawFixtures) {
    var rawErrors = [];
    var processedFixtures = [];
    var length = rawFixtures.length;
    for (var i = 0; i < length; i++) {
        var raw = rawFixtures[i];

        // Start Time
        if (raw.startTime) {
            var startTimeArray = raw.startTime.split(':');
            raw.specificDate = raw.date;
            raw.specificDate.setHours(startTimeArray[0], startTimeArray[1]);
        }
        else {
            rawErrors.push("MISSING: startTime - " + raw.pseudoId)
        }

        // Odds
        var now = new Date();
        if (now < raw.specificDate) {
            if (raw.homeOdds && raw.awayOdds && raw.drawOdds) {
                // Replace carriage returns - eg /n
                raw.homeOdds = raw.homeOdds.replace(/(\r\n|\n|\r)/gm,"");
                raw.awayOdds = raw.awayOdds.replace(/(\r\n|\n|\r)/gm,"");
                raw.drawOdds = raw.drawOdds.replace(/(\r\n|\n|\r)/gm,"");

                // Convert odds to points total
                raw.homeOdds = (Number(raw.homeOdds) * 10) - 10;
                raw.homeOdds = Math.round(raw.homeOdds);
                raw.homeOdds = raw.homeOdds >= 0 ? raw.homeOdds+'' : '0';

                raw.awayOdds = (Number(raw.awayOdds) * 10) - 10;
                raw.awayOdds = Math.round(raw.awayOdds);
                raw.awayOdds = raw.awayOdds >= 0 ? raw.awayOdds+'' : '0';

                raw.drawOdds = (Number(raw.drawOdds) * 10) - 10;
                raw.drawOdds = Math.round(raw.drawOdds);
                raw.drawOdds = raw.drawOdds >= 0 ? raw.drawOdds+'' : '0';
            }
            else {
                rawErrors.push("MISSING: odds - " + raw.pseudoId)
            }
        }

        processedFixtures.push(raw);
    }    

    if (rawErrors.length) {
        return false; //xyz does this report down the the failed promise
    }
    else {
        return processedFixtures;
    }
}

bf.PROCESS.createPromises = function(rawFixtures, organisedIds) {
    var promises = [];

    var length = rawFixtures.length;
    for (var i = 0; i < length; i++) {
        var raw = rawFixtures[i];

        var Fixture = Parse.Object.extend('Fixture');
        var changed = false;
        var isNew = false;

        if (organisedIds[raw.pseudoId]) {
            var fixture = organisedIds[raw.pseudoId];
        }
        else {
            console.log('new fixture')
            var fixture = new Fixture();
            fixture.set('home', raw.home);
            fixture.set('away', raw.away);
            fixture.set('pseudoId', raw.pseudoId);
            fixture.set('homeCode', raw.homeCode);
            fixture.set('awayCode', raw.awayCode);
            isNew = true;
            changed = true;
        }

        // DATE
        if (fixture.get('date').toISOString() !== raw.specificDate.toISOString()) {
            changed = true;
            fixture.set('date', raw.specificDate)
        }

        //BF ID
        if (fixture.get('bfId') !== raw.id) {
            changed = true;
            fixture.set('bfId', raw.id);
        }
        // ODDS
        var now = new Date();
        if (now < raw.specificDate) {
            // if the match has not started
            //HOME ODDS
            if (fixture.get('homeOdds') !== raw.homeOdds) {
                changed = true;
                fixture.set('homeOdds', raw.homeOdds);
            }
            // AWAY ODDS
            if (fixture.get('awayOdds') !== raw.awayOdds) {
                changed = true;
                fixture.set('awayOdds', raw.awayOdds);
            }
            // DRAW ODDS
            if (fixture.get('drawOdds') !== raw.drawOdds) {
                changed = true;
                fixture.set('drawOdds', raw.drawOdds);
            }
        }

        // Now we see whether we need to save this object
        if (changed) {
            fixture.set('source', 'Betfair');
            promises.push(fixture.save())
        }
    } //for

    return promises;
}

bf.PROCESS.bfItemsToRawFixtures = function($) {
    var rawFixtures = [];

    $('.mod-competition-page-coupon').children().each(function(i, elem) {
        var dateRaw = $(elem).find('.coupon-name-header').html();
        if (!dateRaw) {
            console.log('no date')
            return true //xyz does this report down the the failed promise; 
        }
        var date = bf.HELPERS.processDate(dateRaw)

        $(elem).find('.list-coupons').each(function(i) { // for each fixture
            console.log('for');
            var raw = {};
            raw.date = date;
            raw.startTime = $(this).find('.start-time').html();
            raw.id = $(this).find('.vevent').data('eventid');
            raw.home = $(this).find('.home-team').html();
            raw.away = $(this).find('.away-team').html();
            raw.homeOdds = $(this).find('.odds.back.selection-0').find('.price').html();
            raw.awayOdds = $(this).find('.odds.back.selection-2').find('.price').html();
            raw.drawOdds = $(this).find('.odds.back.selection-1').find('.price').html();
            raw.isInplay = $(this).find('.in-play-icon').hasClass('inplay');
            // Get pseudo ID
            raw.awayCode = _maps.betfair[raw.away].code;
            raw.homeCode = _maps.betfair[raw.home].code;
            raw.pseudoId = raw.homeCode + raw.awayCode;

            rawFixtures.push(raw);
        })
    })

    return rawFixtures;
}

module.exports = {
    updateOdds : bf._GET.scores
};