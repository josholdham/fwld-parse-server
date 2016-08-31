module.exports = {
    Fixture : Fixture,
    Prediction : Prediction
};

var totals = require('./totals');

//
//  F I X T U R E
// 
function Fixture(req, res) {
    // Ensure gameweek is a number
    var validation = validateFixture(req);
    if (validation.errors.length > 0) {
        res.error('Validation Error');
        return false;
    }
    else {
        req = validation.req;
    }

    //
    // 1. Update logs
    //
    // 2. If the fixture is newly finished, calculate
    // or recalculate weekly totals
    //
    if (req.object.isNew()) {
        res.success();
    }
    else {
        if (req.object.dirty()) {
            if (!(req.object.dirtyKeys().length === 1 && req.object.dirtyKeys()[0] === 'source')) {
                updateLogs('Fixture', req.object);
                if (req.object.dirtyKeys().indexOf('status') > -1 && req.object.get('status') === 'FINISHED') { //xyz check finished
                    totals.processFixture(req.object)
                }
                res.success();
            }
            else {
                res.error("Nothing to update");
                console.log('NOTHING NEW')
            }
        }
        else {
            res.error("Nothing to update");
            console.log('NOTHING NEW')
        }
    }
}

function validateFixture(req) {
    var validation = {};
    validation.req = req;
    validation.errors = [];

    if (isNaN(req.object.get('gameweek'))) {
        var gw = req.object.get('gameweek');
        var gw = parseInt(gw, 10);
        if (!isNan(gw)) {
            req.object.set('gameweek', gw)
        }
        else {
            console.log("[BS:Fixture] - We couldn't get a number for the gameweek")
            validation.errors.push("We couldn't get a number for the gameweek");
        }
    }

    return validation;
}

function updateLogs(objectType, object) {
    var Log = Parse.Object.extend('Log');
    var log = new Log();
    log.set('objectsType', objectType);
    log.set('objectsId', object.id);

    var dirtyKeys = [];
    var dirty = object.dirtyKeys();
    for (var i in dirty) {
        dirtyKeys.push({'key': dirty[i], 'value' : object.get(dirty[i])})
    }
    log.set('dirty', dirtyKeys)

    log.save().then(function(){}, function(err) {
        console.log(err)
    });
}

//
//
//  P R E D I C T I O N
//
//
function Prediction(req, res) {
    if (req.object.get('deleted')) {
        //this item is being deleted, so save ourselves the check
        res.success()
    }
    else {
        var query = new Parse.Query('Prediction');
        //query.equalTo('userId', req.object.get('userId')); //xyz - would much prefer to use req.user.id
        query.equalTo('fixtureId', req.object.get('fixtureId'));
        query.notEqualTo('deleted', true);
        query.find().then(function(data) {
            console.log(data)
            if (data.length) {
                deletePrediction(data)
            }
            res.success();
        }, function(err) {
            res.success();
        })
    }
}

function deletePredictions(data) {
    var length = data.length;
    for (var i = 0; i < length; i++) {
        data[i].set('deleted', true);
        data[i].save();
    }
}

function test() {
    var query = new Parse.Query('Fixture');
    query.get('5j500Ph3NH').then(function(fixture) {
        console.log(fixture)
        totals.processFixture(fixture)
    }, function(err) {
        console.log('error')
        console.log(err)
    })
    
}
//test()