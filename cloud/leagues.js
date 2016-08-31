module.exports = {
    getLeagues : getLeagues,
    createLeague : createLeague,
    editLeague : editLeague,
    joinLeague : joinLeague
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");

function getLeagues(req, res) {
    if (!req.user) {
        res.error({'code': 399})
    }

    var query = new Parse.Query('League');
    query.equalTo('users', req.user);
    query.include('users');
    query.find().then(function(leagues) {
        res.success(leagues)
    }, function(err) {
        res.error(err)
    })
}

function createLeague(req, res) {
    if (!req.user) {
        res.error({'code': 399})
    }

    var leagueName = req.params.leagueName;
    var gw = req.params.gameweek;
    var leagueType = req.params.leagueType || 'classic';

    if (!leagueName || !gw) {
        res.error({'code': 502, 'message': 'not enough information provided'})
    }

    var userGameweek = {};
    userGameweek[req.user.id] = {'gameweekJoined' : gw};

    var League = Parse.Object.extend('League');
    var league = new League();
    league.set('admin', req.user);
    league.set('adminId', req.user.id);
    league.set('users', [req.user]);
    league.set('userGameweeks', userGameweek);
    league.set('leagueName', leagueName);
    league.set('leagueType', leagueType);
    league.save().then(function(league) {
        // xyz this might not includes users
        res.success(league)
    }, function(err) {
        res.error(err)
    })
}

function editLeague(req, res) {
    if (!req.user) {
        res.error({'code': 399})
    }

    var leagueId = req.params.leagueId;
    if (leagueId) {
        res.error({'code': 501, 'message': 'no league ID provided'})
    }
}

function joinLeague(req, res) {
    if (!req.user) {
        res.error({'code': 399})
    }

    var leagueId = req.params.leagueId;
    var gw = req.params.gameweek;

    if (!leagueId || !gw) {
        res.error({'code': 502, 'message': 'not enough information provided'})
    }

    getLeagueById(leagueId, true).then(function(league) {
        var userGameweeks = league.get('userGameweeks');
        if (userGameweeks[req.user.id]) {
            res.error({'code': 504, 'message': 'you have already joined this league'})
        }
        else {
            userGameweeks[req.user.id] = {'gameweekJoined' : gw};
            league.set('userGameweeks', userGameweeks);
            league.add('users', req.user);
            league.save().then(function(newLeague) {
                // xyz this might not includes users
                res.success(newLeague)
            }, function(err) {
                res.error({'code': 505, 'message': 'there was an error saving the league'})
            })
        }

    }, function(err) {
        res.error({'code': 503, 'message': 'error finding league'})
    })
}

function getLeagueById(leagueId, includeUsers) {
    var query = new Parse.Query('League');
    if (includeUsers) {
        query.include('users')
    }
    return query.get(leagueId)
}