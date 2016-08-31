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
                console.log('[IMPORT - returnFixtures] we have ' +obj.idsRemaining.length+ 'fixtures still to get')
                IMP.generic.getFixtures(obj.idsRemaining).then(function(newFixtures) {
                    cacheManager.addFixturesToIdMap(newFixtures);
                    var fixtures = newFixtures.concat(foundFixtures);
                    console.log('GOT FIXTURES SUCCESS')
                    deferred.resolve(fixtures);
                }, function(err) {
                    console.log('GOT FIXTURES ERROR')

                    deferred.reject(err);
                })
            }

            return deferred.promise;
        },
        getFixtures: function(pseudoIds) {
            console.log('GETTING FIXTURES')
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
        "Hull City FC": {
            "footballData": "Hull City FC",
            "code": "HUL"
        },
        "Middlesbrough": {
            "footballData": "Middlesbrough",
            "code": "MID"
        },
        "Burnley FC": {
            "footballData": "Burnley FC",
            "code": "BUR"
        },
        "Manchester City FC": {
            "footballData": "Manchester City FC",
            "code": "MNC"
        },
        "France": {
            "footballData": "France",
            "code": "FRA"
        },
        "Germany": {
            "footballData": "Germany",
            "code": "GER"
        },
        "Belgium": {
            "footballData": "Belgium",
            "code": "BEL"
        },
        "Portugal": {
            "footballData": "Portugal",
            "code": "POR"
        },
        "Spain": {
            "footballData": "Spain",
            "code": "SPA"
        },
        "Wales": {
            "footballData": "Wales",
            "code": "WAL"
        },
        "England": {
            "footballData": "England",
            "code": "ENG"
        },
        "Austria": {
            "footballData": "Austria",
            "code": "AUS"
        },
        "Switzerland": {
            "footballData": "Switzerland",
            "code": "SWI"
        },
        "Romania": {
            "footballData": "Romania",
            "code": "ROM"
        },
        "Czech Republic": {
            "footballData": "Czech Rpublic",
            "code": "CZE"
        },
        "Croatia": {
            "footballData": "Croatia",
            "code": "CRO"
        },
        "Italy": {
            "footballData": "Italy",
            "code": "ITA"
        },
        "Slovakia": {
            "footballData": "Slovakia",
            "code": "SLO"
        },
        "Iceland": {
            "footballData": "Iceland",
            "code": "ICE"
        },
        "Russia": {
            "footballData": "Russia",
            "code": "RUS"
        },
        "Albania": {
            "footballData": "Albania",
            "code": "ALB"
        },
        "Northern Ireland": {
            "footballData": "Northern Ireland",
            "code": "NOI"
        },
        "Poland": {
            "footballData": "Poland",
            "code": "POL"
        },
        "Turkey": {
            "footballData": "Turkey",
            "code": "TUR"
        },
        "Ukraine": {
            "footballData": "Ukraine",
            "code": "UKR"
        },
        "Sweden": {
            "footballData": "Sweden",
            "code": "SWE"
        },
        "Republic of Ireland": {
            "footballData": "Republic of Ireland",
            "code": "ROI"
        },
        "Hungary": {
            "footballData": "Hungary",
            "code": "HUN"
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
        "Swansea": {
            "footballData": "Swansea City FC",
            "code": "SWA"
        },
        "Burnley": {
            "footballData": "Burnley FC",
            "code": "BUR"
        },
        "Middlesbrough": {
            "footballData": "Middlesbrough",
            "code": "MID"
        },
        "Hull": {
            "footballData": "Hull City FC",
            "code": "HUL"
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
        },
        "Burnley": {
            "footballData": "Burnley FC",
            "code": "BUR"
        },
        "Middlesbrough": {
            "footballData": "Middlesbrough",
            "code": "MID"
        },
        "Hull City": {
            "footballData": "Hull City FC",
            "code": "HUL"
        }
    }
}

module.exports = {
    IMP : IMP,
    _maps : _maps
};

// var CronJob = require('cron').CronJob;
// new CronJob('* 0 */1 * * * *', function() {
//   //updateOdds()
// }, null, true);
