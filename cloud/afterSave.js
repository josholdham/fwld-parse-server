module.exports = {
    Fixture : Fixture,
};

var cache = require('memory-cache');
var cacheManager = require('./cacheManager');

//
//  F I X T U R E
// 
function Fixture(req, res) {
    //console.log('fixture after save')
    //updateCache(req.object);
    cacheManager.addFixture(req.object)
}

// function updateCache(obj) {
//     var gw = obj.get('gameweek');
//     var cached = cache.get('fixture_' + gw);
//     if (cached) {
//         var update = false;
//         var length = cached.length;
//         for (var i = 0; i < length; i++) {
//             if (cached[i].id === obj.id) {
//                 update = true;
//                 cached[i] = obj;
//                 cache.put('fixture_' + gw, cached);
//                 continue;
//             }
//         }
//     }
// }