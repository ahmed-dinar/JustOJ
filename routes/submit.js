'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var fs = require('fs');
var Busboy = require('busboy');
var uuid = require('uuid');
var mkdirp = require('mkdirp');
var async = require('async');
var has = require('has');
var entities = require('entities');
var logger = require('winston');

var isLoggedIn = require('../middlewares/isLoggedIn');
var Judge = require('../lib/compiler/sandbox/judge');
var MyUtil = require('../lib/myutil');
var Problems = require('../models/problems');
var Submission = require('../models/submission');

router.post('/:pid', isLoggedIn(true), function(req, res, next) {

    var uploadName = uuid.v4();
    var codeDir = MyUtil.UPLOAD_DIR + '/' + uploadName;
    var problemId = req.params.pid;
    var userId = String(req.user.id);

    async.waterfall([
        function(callback){
            makeTempDir({ codeDir: codeDir }, callback);
        },
        function(opts,callback){
            opts['problemId'] = problemId;
            opts['userId'] = userId;
            getLimits(opts,callback); //also check valid problem id
        },
        function(opts,callback) {
            getForm(req,opts,callback);
        },
        function(opts,callback){
            insertSubmissionIntoDb('5',opts,callback);
        },
        incrementSubmission,
        renameSource
    ], function (error, opts) {

        if( error ){

            logger.debug(error);

            if( typeof error !== 'object' ) return next(new Error(error));

            // user form empty errors
            if( has(error,'formError') ){
                req.flash('formError',error.formError);
                res.redirect('/problems/JOP0' + problemId);
                return;
            }

            if( has(error,'systemError') ){
                return insertSubmissionIntoDb('8',opts,function (err) {
                    if( err ) return next(new Error(err));

                    res.redirect('/status/u/' + problemId);
                });
            }

            return next(new Error(error));
        }

        logger.debug('Successfully Submitted'.green);
        res.redirect('/status/' + opts.submissionId);


        //run code against test cases in sandbox
        Judge.run(opts,function(err,runs){
            if( err ){
                logger.debug('Judge Error!'.red);
                return;
            }
            logger.debug('successfully run!'.green);
            logger.debug(runs);
        });
    });
});



/**
 * Get submitted problem's limits from database
 * @param opts
 * @param callback
 */
var getLimits = function(opts,callback){

    Problems.findById(opts.problemId,['cpu','memory'],function(err,rows){

        if(err) return callback(err);

        if( rows.length === 0 ) return callback({ formError: '404, no problem found'});

        if( rows === null || rows[0].cpu === null || rows[0].memory === null )
            return callback(null,{ systemError: 'no limit found for this problem!' });

        opts['timeLimit'] = rows[0].cpu;
        opts['memoryLimit'] = rows[0].memory;
        return callback(null, opts);
    });
};



/**
 * Get and save multipart form from HTTP request
 * @param req
 * @param opts
 * @param cb
 */
var getForm = function(req,opts,cb){

    var error = 0;
    var fstream = null;
    var language = null;

    var busboy = new Busboy({
        headers: req.headers,
        limits:{
            files: 1,               //only user code file
            fields: 1,              //only language
            parts: 2,               //code and language
            fileSize: 50000         // (in bytes)
        }
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        language = val;
        logger.debug(('[' + fieldname + '] = ' + val).yellow);
    });


    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        if( filename.length ){

            logger.debug((filename +' receieved with mimetype: ' + mimetype).yellow);

            fstream = fs.createWriteStream(opts.codeDir + '/code.txt');

            file.on('limit', function() {  //source size limit
                error = 2;
            });

            file.pipe(fstream);
        }else {    //no file choosen, empty field
            error = 1;
            file.resume();
        }

    });


    busboy.on('finish', function() {

        if( error === 1 ){
            logger.debug('Submit Source Required'.red);
            return cb({ formError: 'Source Required' });
        }

        if( error === 2 ){
            logger.debug('Source Size Limit Exceeded'.red);
            return cb({ formError: 'Source Size Limit Exceeded' });
        }


        fstream.on('close', function () {

            logger.debug('fstream closed');

            if( language ){
                opts['language'] = language;
                if( has(opts,'systemError') )
                    return cb({ systemError: opts.systemError },opts);

                return cb(null,opts);
            }

            logger.debug('language Required'.red);
            cb({ formError: 'empty fields of sumission form' });
        });
    });

    req.pipe(busboy);
};


/**
 * Insert submission into database , also insert submitted code
 * @param submissionStatus
 * @param opts
 * @param callback
 */
var insertSubmissionIntoDb = function (submissionStatus,opts,callback) {

    async.waterfall([
        function(cb){

            Submission.insert({
                pid: opts.problemId,
                uid: opts.userId,
                language: opts.language,
                status: submissionStatus,
                cpu: '0',
                memory: '0'
            },function(err,sid){
                if( err ){
                    logger.debug('inserting Submission error!'.bold.red);
                    return cb(err);
                }
                opts['submissionId'] = String(sid);
               // opts['codeDir'] = MyUtil.SUBMISSION_DIR + '/' + opts.submissionId;
                cb();
            });
        },
        function(cb){
            if( submissionStatus === '8' ) return cb(null,'');  //system erro, ignore code

            fs.readFile(opts.codeDir + '/code.txt', 'utf8', function(err, submittedCode) {
                if (err){
                    logger.debug('error reading code file code'.red);
                    return cb(err);
                }
                logger.debug(submittedCode);
                cb(null,submittedCode);
            });
        },
        function(submittedCode,cb){
            if( submissionStatus === '8' ) return cb();  //system erro, ignore code

            submittedCode = entities.encodeHTML(submittedCode);

            Submission.insertCode({
                sid: opts.submissionId,
                code: submittedCode
            },function(err){
                if(err){
                    logger.debug('error inserting code'.red);
                    return cb(err);
                }
                cb();
            });
        }
    ], function (error) {
        if(error) logger.debug(error);
        callback(null,opts);
    });
};


/**
 * increment Submission count of this problem
 * @param opts
 * @param callback
 */
var incrementSubmission = function (opts,callback) {
    Problems.updateSubmission(opts.problemId, 'submissions', function(err){
        if( err ){
            logger.debug('Updating submission errr'.red);
            return callback(err);
        }
        callback(null,opts);
    });
};


/**
 * Create temporary directory to save uploaded code
 * @param opts
 * @param cb
 */
var makeTempDir = function(opts,cb){
    mkdirp(opts.codeDir, function (err) {
        if (err) {
            logger.debug(opts.codeDir + ' creation failed! permission denied!!'.underline.red);
            return cb(err);
        }
        logger.debug((opts.codeDir + ' Created').green);
        cb(null,opts);
    });
};

/**
 *
 * @param opts
 * @param cb
 */
var renameSource = function(opts,cb) {
    fs.rename(opts.codeDir + '/code.txt', opts.codeDir + '/code.' + opts.language, function(err) {
        if ( err ) {
            logger.debug('ERROR renaming: ');
            logger.debug(err);
            return cb({ systemError: 'error renaming code file' },opts);
        }
        cb(null,opts);
    });
};

module.exports = router;
