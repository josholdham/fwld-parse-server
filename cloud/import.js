module.exports = {
    getInitialFixtures : getInitialFixtures,
    updateOdds : updateOdds,
    checkScores : checkScores
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");
var cache = require('memory-cache');
var cacheManager = require('./cacheManager');

//
//
//  M A P S
//
//
var _maps = {
    "footballData" : {
        "Manchester United FC": {
            "footballData": "Manchester United FC",
            "code": "MNU"
        },
        "Tottenham Hotspur FC": {
            "footballData": "Tottenham Hotspur FC",
            "code": "TOT"
        },
        "Everton FC": {
            "footballData": "Everton FC",
            "code": "EVE"
        },
        "Watford FC": {
            "footballData": "Watford FC",
            "code": "WAT"
        },
        "Leicester City FC": {
            "footballData": "Leicester City FC",
            "code": "LEI"
        },
        "Sunderland AFC": {
            "footballData": "Sunderland AFC",
            "code": "SUN"
        },
        "Norwich City FC": {
            "footballData": "Norwich City FC",
            "code": "NOR"
        },
        "Crystal Palace FC": {
            "footballData": "Crystal Palace FC",
            "code": "CRY"
        },
        "AFC Bournemouth": {
            "footballData": "AFC Bournemouth",
            "code": "BOU"
        },
        "Aston Villa FC": {
            "footballData": "Aston Villa FC",
            "code": "AST"
        },
        "Chelsea FC": {
            "footballData": "Chelsea FC",
            "code": "CHE"
        },
        "Swansea City FC": {
            "footballData": "Swansea City FC",
            "code": "SWA"
        },
        "Newcastle United FC": {
            "footballData": "Newcastle United FC",
            "code": "NEW"
        },
        "Southampton FC": {
            "footballData": "Southampton FC",
            "code": "SOU"
        },
        "Arsenal FC": {
            "footballData": "Arsenal FC",
            "code": "ARS"
        },
        "West Ham United FC": {
            "footballData": "West Ham United FC",
            "code": "WHU"
        },
        "Stoke City FC": {
            "footballData": "Stoke City FC",
            "code": "STO"
        },
        "Liverpool FC": {
            "footballData": "Liverpool FC",
            "code": "LIV"
        },
        "West Bromwich Albion FC": {
            "footballData": "West Bromwich Albion FC",
            "code": "WBA"
        },
        "Manchester City FC": {
            "footballData": "Manchester City FC",
            "code": "MNC"
        }
    },
    "betfair" : {
        "Man Utd": {
            "footballData": "Manchester United FC",
            "code": "MNU"
        },
        "Tottenham": {
            "footballData": "Tottenham Hotspur FC",
            "code": "TOT"
        },
        "Everton": {
            "footballData": "Everton FC",
            "code": "EVE"
        },
        "Watford": {
            "footballData": "Watford FC",
            "code": "WAT"
        },
        "Leicester": {
            "footballData": "Leicester City FC",
            "code": "LEI"
        },
        "Sunderland": {
            "footballData": "Sunderland AFC",
            "code": "SUN"
        },
        "Norwich": {
            "footballData": "Norwich City FC",
            "code": "NOR"
        },
        "C Palace": {
            "footballData": "Crystal Palace FC",
            "code": "CRY"
        },
        "Bournemouth": {
            "footballData": "AFC Bournemouth",
            "code": "BOU"
        },
        "Aston Villa": {
            "footballData": "Aston Villa FC",
            "code": "AST"
        },
        "Chelsea": {
            "footballData": "Chelsea FC",
            "code": "CHE"
        },
        "Swansea": {
            "footballData": "Swansea City FC",
            "code": "SWA"
        },
        "Newcastle": {
            "footballData": "Newcastle United FC",
            "code": "NEW"
        },
        "Southampton": {
            "footballData": "Southampton FC",
            "code": "SOU"
        },
        "Arsenal": {
            "footballData": "Arsenal FC",
            "code": "ARS"
        },
        "West Ham": {
            "footballData": "West Ham United FC",
            "code": "WHU"
        },
        "Stoke": {
            "footballData": "Stoke City FC",
            "code": "STO"
        },
        "Liverpool": {
            "footballData": "Liverpool FC",
            "code": "LIV"
        },
        "West Brom": {
            "footballData": "West Bromwich Albion FC",
            "code": "WBA"
        },
        "Man City": {
            "footballData": "Manchester City FC",
            "code": "MNC"
        }
    },
    "yahoo" : {
        "Manchester United": {
            "footballData": "Manchester United FC",
            "code": "MNU"
        },
        "Tottenham Hotspur": {
            "footballData": "Tottenham Hotspur FC",
            "code": "TOT"
        },
        "Everton": {
            "footballData": "Everton FC",
            "code": "EVE"
        },
        "Watford": {
            "footballData": "Watford FC",
            "code": "WAT"
        },
        "Leicester City": {
            "footballData": "Leicester City FC",
            "code": "LEI"
        },
        "Sunderland": {
            "footballData": "Sunderland AFC",
            "code": "SUN"
        },
        "Norwich City": {
            "footballData": "Norwich City FC",
            "code": "NOR"
        },
        "Crystal Palace": {
            "footballData": "Crystal Palace FC",
            "code": "CRY"
        },
        "Bournemouth": {
            "footballData": "AFC Bournemouth",
            "code": "BOU"
        },
        "Aston Villa": {
            "footballData": "Aston Villa FC",
            "code": "AST"
        },
        "Chelsea": {
            "footballData": "Chelsea FC",
            "code": "CHE"
        },
        "Swansea City": {
            "footballData": "Swansea City FC",
            "code": "SWA"
        },
        "Newcastle United": {
            "footballData": "Newcastle United FC",
            "code": "NEW"
        },
        "Southampton": {
            "footballData": "Southampton FC",
            "code": "SOU"
        },
        "Arsenal": {
            "footballData": "Arsenal FC",
            "code": "ARS"
        },
        "West Ham United": {
            "footballData": "West Ham United FC",
            "code": "WHU"
        },
        "Stoke City": {
            "footballData": "Stoke City FC",
            "code": "STO"
        },
        "Liverpool": {
            "footballData": "Liverpool FC",
            "code": "LIV"
        },
        "West Bromwich Albion": {
            "footballData": "West Bromwich Albion FC",
            "code": "WBA"
        },
        "Manchester City": {
            "footballData": "Manchester City FC",
            "code": "MNC"
        }
    }
}

//
//
//  F U N C T I O N S
//
//
var IMP = {
    helpers: {
        round: function(num, decimals) {
            var t=Math.pow(10, decimals);   
            return (Math.round((num * t) + (decimals>0?1:0)*(Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
        }
    },
    generic: {
        returnFixtures: function(params) {
            var deferred = q.defer();
            var foundFixtures = [];
            var idsRemaining = [];

            var obj = IMP.generic.checkCache(params.pseudoIds);
            if (obj.idsRemaining.length <= 0) {
                deferred.resolve(obj.foundFixtures)
                foundFixtures = obj.foundFixtures;
                idsRemaining = obj.idsRemaining;
            }
            else {
                console.log('[IMPORT - returnFixtures] we have ' +idsRemaining.length+ 'fixtures still to get')
                IMP.generic.getFixtures(idsRemaining).then(function(newFixtures) {
                    cacheManager.addFixturesToIdMap(newFixtures);
                    var fixtures = newFixtures.concat(foundFixtures);
                    deferred.resolve(fixtures);
                }, function(err) {

                })
            }

            return deferred.promise;
        },
        getFixtures: function(pseudoIds) {
            var query = new Parse.Query('Fixture');
            query.containedIn('pseudoId', pseudoIds);
            return query.find();
        },
        checkCache: function(pseudoIds) {
            var obj = {};
            obj.idsRemaining = [];
            obj.foundFixtures = [];
            var length = pseudoIds.length;
            for (var i = 0; i < length; i++) {
                var pseudoId = pseudoIds[i]
                var cached = cache.get('f_' + pseudoId);
                if (cached) {
                    obj.foundFixtures.push(cached)
                }
                else {
                    obj.idsRemaining.push(pseudoId)
                }
            }

            return obj;
        },
        organiseFixtures: function(data) {
            var organisedIds = {};
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var pseudoId = data[i].get('pseudoId');
                organisedIds[pseudoId] = data[i];
            }
            return organisedIds;
        }
    }
}

//
//
//  B E T F A I R
//
//

function updateOdds(req, res) {
    url = 'https://www.betfair.com/exchange/football/competition?id=31'

    request(url, function(error, response, html) {
        if (error) {
            res.error(error)
            return false
        }

        var $ = cheerio.load(html);
        var pseudoIds = BF.getIds($);
        var organisedIds = {};

        // Query existing items
        IMP.generic.returnFixtures({'pseudoIds' : pseudoIds}).then(function(data) {
            organisedIds = IMP.generic.organiseFixtures(data);
            return;
        }).then(function() {
            return processHTML($)
        }).then(function(rawFixtures) {
            return createParseObjects(rawFixtures, organisedIds)
        }).then(function(promises) {
            return Parse.Promise.when(promises);
        }).then(function(promises) {
            console.log('[IMPORT - updateOdds] Promises Completed')
            res.success("");
        }, function(err) {
            console.error('[IMPORT - updateOdds] Error in promise chain');
            console.error(err)
            res.error(err)
        });
    }) 
}

var BF = {
    getIds : function($) {
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
        return ids;
    },
    helpers: {
        processDate: function(dateRaw) {
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
    }
}

var validateBfData = function(raw) {
    raw.errors = []

    // Start Time
    if (raw.startTime) {
        var startTimeArray = raw.startTime.split(':');
        raw.specificDate = raw.date;
        raw.specificDate.setHours(startTimeArray[0], startTimeArray[1]);
    }
    else {
        raw.errors.push("MISSING: startTime")
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
            raw.errors.push("MISSING: odds")
        }
    }
    

    return raw;
}

var processHTML = function($) {
    var rawFixtures = [];

    $('.mod-competition-page-coupon').children().each(function(i, elem) {
        var dateRaw = $(elem).find('.coupon-name-header').html();
        if (!dateRaw) { return; }
        var date = BF.helpers.processDate(dateRaw)

        $(elem).find('.list-coupons').each(function(i) {
            // Get raw values from the HTML
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
            raw.pseudoId = homeCode + awayCode;

            // Validate the data
            raw = validateBfData(raw); 
            if (raw.errors.length > 0) { // xyz we should log error here
                return;
            }
            else {
                rawFixtures.push(raw);
            }
        })
    })

    return rawFixtures;
}

var createParseObjects = function(rawFixtures, organisedIds) {
    var promises = [];

    var length = rawFixtures.length;
    for (var i = 0; i < length; i++) {
        var raw = rawFixtures[i];

        var Fixture = Parse.Object.extend('Fixture');
        var isNew = false;
        if (organisedIds[raw.pseudoId]) {
            var fixture = organisedIds[raw.pseudoId];
        }
        else {
            var fixture = new Fixture();
            isNew = true;
        }

        // Set properties on Parse Object
        var changed = false;
        // Stuff that can only be added to new items
        if (isNew) {
            changed = true;
            fixture.set('home', raw.home);
            fixture.set('away', raw.away);
            fixture.set('pseudoId', raw.pseudoId);
            fixture.set('homeCode', raw.homeCode);
            fixture.set('awayCode', raw.awayCode);
        }
        // DATE
        if (fixture.get('date').toISOString() !== raw.specificDate.toISOString()) {
            changed = true;
            fixture.set('date', raw.specificDate)
        }
        //BF ID
        if (fixture.get('bfId') !== id) {
            changed = true;
            fixture.set('bfId', id);
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


//
//
//  Y A H O O
//
//

function checkScores(req, res) {
    url = 'https://sports.yahoo.com/soccer/premier-league/scoreboard/'

    request(url, function(error, response, html) {
        // First we'll check to make sure no errors occurred when making the request
        if (error) {
            res.error(error)
            return false
        }

        var $ = cheerio.load(html);
        var ids = extractYahooIds($);

        // Query existing items
        var query = new Parse.Query('Fixture');
        query.containedIn('pseudoId', ids);
        query.find().then(function(data) {
            var organisedIds = {};
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var pseudoId = data[i].get('pseudoId');
                organisedIds[pseudoId] = data[i];
            }
            return updateResultInformation($, organisedIds);
        }).then(function(promises) {
            Parse.Promise.when(promises).then(function(data) {
                res.success()
            }, function(err) {
                res.error(err)
            })
        })
    }) 
}

var extractYahooIds = function($) {
    var ids = [];
    $('table.list').children('tbody').children('.game').each(function(i, elem) {
        var home = $(this).children('.away').children('.team').children('em').html();
        var away = $(this).children('.home').children('.team').children('em').html();
        var homeCode = _maps.yahoo[home].code;
        var awayCode = _maps.yahoo[away].code;
        var pseudoId = homeCode+awayCode;
        ids.push(pseudoId);
    })
    return ids;
}

var updateResultInformation = function($, organisedIds) {
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

//
//
//  F O O T B A L L   D A T A
//
//

function getInitialFixtures(req, res) {
    //console.log('HEWLLO')
    var deferred = q.defer();
    var leagueId = req.params.leagueId || 398;

    var options = {
      url: "http://api.football-data.org/alpha/soccerseasons/" + leagueId + "/fixtures",
      headers: {
        'X-Auth-Token': '3975c02fe0fc48908d2586d750190a39'
      }
    };

    request(options, function(err, response, body) {
        var body = body ? JSON.parse(body) : null;

        if (err || body && body.error) {
            var detail = body && body.error ? body.error : null;
            deferred.reject({'code': 410, 'msg': 'error requesting fixtures from football-data', "detail" : detail});
            return;
        }

        var promises = organiseFootballData(body.fixtures);
        Parse.Promise.when(promises).then(function(data) {
            res.success(data);
        }, function(err) {
            res.error(err)
        })

    })

    return deferred.promise;
}

function organiseFootballData(results) {
    var length = results.length;
    var fixtures = [];

    for (var i = 0; i < length; i++) {
        var Fixture = Parse.Object.extend('Fixture');
        var fixture = new Fixture();

    // Set date
        fixture.set('date', new Date(new Date(results[i].date).setHours(0,0,0,0))); //xyz - change to include time
        var time = new Date(results[i].date).getHours() + ':' + new Date(results[i].date).getMinutes();
        fixture.set('time', time)

        // Set team names
        fixture.set('fd_home', results[i].homeTeamName);
        fixture.set('fd_away', results[i].awayTeamName);
        fixture.set('homeCode', _maps.footballData[results[i].homeTeamName].code);
        fixture.set('awayCode', _maps.footballData[results[i].awayTeamName].code);
        fixture.set('pseudoId', _maps.footballData[results[i].homeTeamName].code + _maps.footballData[results[i].awayTeamName].code)
        
        // Status
        var status = results[i].status === 'TIMED' ? 'UPCOMING' : results[i].status;
        fixture.set('status', status)
        // Set result if there is one
        if (status === "FINISHED") {
            fixture.set('homeScore', results[i].result.goalsHomeTeam);
            fixture.set('awayScore', results[i].result.goalsAwayTeam);
            fixture.set('score', results[i].result.goalsHomeTeam + ' - ' + results[i].result.goalsAwayTeam);

            if(results[i].result.goalsHomeTeam === results[i].result.goalsAwayTeam){
                fixture.set('result', 'draw');
            }
            else if(results[i].result.goalsHomeTeam  > results[i].result.goalsAwayTeam){
                fixture.set('result', 'home');
            }
            else if(results[i].result.goalsHomeTeam  < results[i].result.goalsAwayTeam){
                fixture.set('result', 'away');
            }
        }
        

        // Determine gameweek
        fixture.set('gameweek', results[i].matchday);
        fixture.set('source', 'Football Data')
        
        fixtures.push(fixture.save())
    }

    return fixtures
}



// var CronJob = require('cron').CronJob;
// new CronJob('* 0 */1 * * * *', function() {
//   //updateOdds()
// }, null, true);

