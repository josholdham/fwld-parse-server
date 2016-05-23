var importer = require('./import.js');
var beforeSave = require('./beforeSave.js');
var afterSave = require('./afterSave.js');
var fixtures = require('./fixtures.js');
var predictions = require('./predictions.js');
var tasks = require('./tasks.js');


Parse.Cloud.beforeSave('Fixture', beforeSave.Fixture);
Parse.Cloud.beforeSave('Prediction', beforeSave.Prediction);

Parse.Cloud.afterSave('Fixture', afterSave.Fixture);

Parse.Cloud.define('getInitialFixtures', importer.getInitialFixtures);
Parse.Cloud.define('updateOdds', importer.updateOdds);
Parse.Cloud.define('checkScores', importer.checkScores);

//
//  C L I E N T
//

Parse.Cloud.define('createWeeklyTotals', tasks.createWeeklyTotals);
Parse.Cloud.define('destroyWeeklyTotals', tasks.removeWeeklyTotals);
Parse.Cloud.define('bulkUpdateFixtures', tasks.bulkUpdateFixtures);

//
//  C L I E N T
//

Parse.Cloud.define('getFixtures', fixtures.getFixtures);
Parse.Cloud.define('makePrediction', predictions.makePrediction);
Parse.Cloud.define('deletePrediction', predictions.deletePrediction);


