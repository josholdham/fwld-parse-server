module.exports = {
    reportError : reportError
};

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var q = require('q');
var request = require("request");

function reportError(params) {
    console.log('***** ERROR *****');
    console.log(params);
}