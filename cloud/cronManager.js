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

var CronJob = require('cron').CronJob;

// every 15 minutes between 9am and 9pm
var job = new CronJob('* 0 */15 9-21 * * *', function() {

}, function() {
    console.log('done')
}, true);

