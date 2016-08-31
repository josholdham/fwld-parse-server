var beforeSave = require('./beforeSave.js');
var afterSave = require('./afterSave.js');
var fixtures = require('./fixtures.js');
var predictions = require('./predictions.js');
var tasks = require('./tasks.js');
var leagues = require('./leagues.js');

var importer = require('./import/main.js');



Parse.Cloud.beforeSave('Fixture', beforeSave.Fixture);
Parse.Cloud.beforeSave('Prediction', beforeSave.Prediction);
Parse.Cloud.afterSave('Fixture', afterSave.Fixture);

//
//  A D M I N
//
Parse.Cloud.define('getInitialFixtures', importer.updateFixtures);
Parse.Cloud.define('updateOdds', importer.updateOdds);
Parse.Cloud.define('checkScores', importer.updateScores);

Parse.Cloud.define('createWeeklyTotals', tasks.createWeeklyTotals);
Parse.Cloud.define('destroyWeeklyTotals', tasks.removeWeeklyTotals);
Parse.Cloud.define('bulkUpdateFixtures', tasks.bulkUpdateFixtures);

//
//  C L I E N T
//

Parse.Cloud.define('getFixtures', fixtures.getFixtures);
Parse.Cloud.define('makePrediction', predictions.makePrediction);
Parse.Cloud.define('deletePrediction', predictions.deletePrediction);

Parse.Cloud.define('getLeagues', leagues.getLeagues);
Parse.Cloud.define('createLeague', leagues.createLeague);
Parse.Cloud.define('editLeague', leagues.editLeague);
Parse.Cloud.define('joinLeague', leagues.joinLeague);




