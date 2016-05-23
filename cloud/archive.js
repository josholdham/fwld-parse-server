var Horseman = require('node-horseman');
var horseman = new Horseman();

horseman
  .open('https://www.betfair.com/exchange/football/competition?id=4527196')
  .waitForSelector('.yui3-new-coupon')
  .count('.yui3-new-coupon')
  .log()
  .evaluate( function(selector){

    var array = [];
    console.log(selector);
    if (selector) {
        $(selector).each(function( index ) {
            console.log(index)
            var dateRaw = $(this).find('.coupon-name-header');
            console.log(dateRaw)
            var date = new Date(dateRaw);
            console.log(date);

            $(this).find('.list-coupons').each(function(i) {
                var obj = {};
                obj.date = date;
                obj.dateRaw = dateRaw;
                obj.home = $(this).find('.home-team').html();
                obj.away = $(this).find('.away-team').html();
                obj.startTime = $(this).find('.start-time').html();
                obj.homeOdds = $(this).find('.odds.back.selection-0').find('.price').html();
                obj.awayOdds = $(this).find('.odds.back.selection-2').find('.price').html();
                obj.drawOdds = $(this).find('.odds.back.selection-1').find('.price').html();
            })

            array.push(obj);
        })
    }

    console.log(array);

    return array
  }, '.yui3-new-coupon')
  .log() // []
  .close();