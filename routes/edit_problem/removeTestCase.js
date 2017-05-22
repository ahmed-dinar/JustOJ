'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs');
var logger = require('winston');
var async = require('async');

var Problems = require('../../models/problems');

module.exports = function(req, res, next) {

    var problemId = req.body.pid;

    if( !problemId || !req.body.casename )
        return next(new Error('No Request body found'));

    async.waterfall([
        async.apply(findProblem, problemId),
        async.apply(deleteTestCase, req.body.casename),
        readTestCaseDir,
        updateProblem
    ], function (err) {
        if( err ){
            logger.error(err);
            req.flash('tcRemErr','Something wrong');
        }else{
            req.flash('tcRemSuccess', 'Test Case Removed');
        }
        res.redirect('/problems/edit/' + problemId + '/2');
    });
};


/**
 *
 * @param problemId
 * @param callback
 */
function findProblem(problemId, callback) {
    Problems.findById(problemId,['id'],function(err,row){
        if( err )
            return callback(err);

        if( row.length === 0 )
            return callback('404 no problem found');

        callback(null, problemId);
    });
}


/**
 *
 * @param casename
 * @param problemId
 * @param callback
 */
function deleteTestCase(casename, problemId, callback) {
    var TCDir = path.normalize(process.cwd() + '/files/tc/p/' + problemId + '/' + casename);
    logger.debug('tc to remove ' + TCDir);
    rimraf(TCDir, function (err) {
        if(err)
            return callback(err);

        callback(null,problemId);
    });
}


/**
 *
 * @param problemId
 * @param callback
 */
function readTestCaseDir(problemId, callback) {

    var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + problemId);
    fs.readdir(rootDir, function(err, files) {

        var skipUpdate = true;
        if( err ){
            if( err.code === 'ENOENT' )
                skipUpdate = false;
            else
                return callback(err);
        }

        if(!files || !files.length)
            skipUpdate = false;

        callback(null, problemId, skipUpdate);
    });
}


/**
 *
 * @param problemId
 * @param skipUpdate
 * @param callback
 * @returns {*}
 */
function updateProblem(problemId, skipUpdate, callback) {

    //still have some test case, leave it
    if(skipUpdate)
        return callback();

    logger.debug('No more test cases, Set problem status incomplete');

    //there is no test case for this problem, set problem status to incomplete
    Problems.updateByColumn(problemId, { 'status': 'incomplete' }, callback);
}