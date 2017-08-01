'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs');
var logger = require('winston');
var async = require('async');

//var AppError = appRequire('lib/custom-error');
var Problems = appRequire('models/problems');

module.exports = function(pid, caseId, res) {

  async.waterfall([
    async.apply(deleteTestCase, pid, caseId),
    readTestCaseDir,
    updateProblem
  ],
  function (err) {
    if( err ){
      if(err.name === 'input'){
        return res.status(400).json({ error: err.message });
      }

      logger.error(err);
      return res.sendStatus(500);
    }
    res.sendStatus(200);
  });
};


//
//
//
function deleteTestCase(pid, caseId, callback) {
  var TCDir = path.normalize(process.cwd() + '/files/tc/p/' + pid + '/' + caseId);
  logger.debug('tc to remove ' + TCDir);
  rimraf(TCDir, function (err) {
    if(err){
      return callback(err);
    }

    callback(null, pid);
  });
}


//
//
//
function readTestCaseDir(pid, callback) {

  var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + pid);
  fs.readdir(rootDir, function(err, files) {
    var skipUpdate = true;

    if( err ){
      if( err.code !== 'ENOENT' ){
        return callback(err);
      }
      //ENOENT = no more test case remains
      skipUpdate = false;
    }

    //no more test case remains
    if(!files || !files.length){
      skipUpdate = false;
    }

    callback(null, pid, skipUpdate);
  });
}


//
//
//
function updateProblem(pid, skipUpdate, callback) {
  //still have some test cases, leave it
  if(skipUpdate){
    return callback();
  }

  logger.debug('No more test cases, Set problem status incomplete');

  //there is no test case for this problem, set problem status to incomplete
  Problems
    .updateByColumn(pid, {
      status: 'incomplete'
    }, callback);
}