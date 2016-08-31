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

var fd = {};
fd._GET = {};

fd._GET.fixtures = function(req, res) {
    //console.log('HEWLLO')
    var deferred = q.defer();
    var leagueId = req.params.leagueId || 426;

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

        if (!req.params.justLog) {
            var promises = organiseFootballData(body.fixtures);
            Parse.Promise.when(promises).then(function(data) {
                res.success(data);
            }, function(err) {
                res.error(err)
            })
        }
        else {
            var organised = organiseFootballData(body.fixtures, true);
            console.log('*********');
            var obj = {'raw': body.fixtures, 'organised': organised};
            console.log(obj);
            res.success(obj)
        }
    })

    return deferred.promise;
}

function organiseFootballData(results, justLog) {
    console.log(results)
    var length = results.length;
    var fixtures = [];

    for (var i = 0; i < length; i++) {
        var Fixture = Parse.Object.extend('Fixture');
        var fixture = new Fixture();

    // Set date
        fixture.set('date', new Date(results[i].date));
        var time = new Date(results[i].date).getHours() + ':' + new Date(results[i].date).getMinutes();
        fixture.set('time', time)

        // Set team names
        fixture.set('fd_home', results[i].homeTeamName);
        fixture.set('fd_away', results[i].awayTeamName);
        fixture.set('homeCode', _maps.footballData[results[i].homeTeamName].code);
        fixture.set('awayCode', _maps.footballData[results[i].awayTeamName].code);
        fixture.set('pseudoId', _maps.footballData[results[i].homeTeamName].code + _maps.footballData[results[i].awayTeamName].code)
        
        // Status
        var status = results[i].status === 'TIMED' || results[i].status === 'SCHEDULED' ? 'UPCOMING' : results[i].status;
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
        
        if (justLog) {
            fixtures.push(fixture.attributes);
        }
        else {
            fixtures.push(fixture.save())
        }
    }

    return fixtures
}

module.exports = {
    updateFixtures : fd._GET.fixtures
};