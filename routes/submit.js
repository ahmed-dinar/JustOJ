var express     = require('express');
var router      = express.Router();

var fse         = require('fs-extra');
var fs          = require('fs');
var path        = require("path");

var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var mkdirp      = require('mkdirp');
var async       = require('async');
var moment      = require("moment");
var has         = require('has');
var mv          = require('mv');

var isLoggedIn  = require('../middlewares/isLoggedIn');
var Judge       = require('../helpers/compiler/sandbox/judge');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var Submission  = require('../models/submission');

var colors      = require('colors');

router.post('/:pid', isLoggedIn(true), function(req, res, next) {

    var uploadName = uuid.v4();
    var uploadedFile =  MyUtil.RUN_DIR + '/' + uploadName;
    var problemId = req.params.pid;
    var userId = String(req.user.id);

    async.waterfall([
        function(callback){
            makeTempDir({ codeDir: uploadedFile  }, callback);
        },
        function(ignore_please,callback){
            getLimits(problemId,callback); //also check valid problem id
        },
        function(opts,callback) {
            opts['uploadedFile'] = uploadedFile;
            opts['problemId'] = problemId;
            getForm(uploadedFile,req,opts,callback);
        },
        function(opts,callback){
            insertSubmissionIntoDb(problemId,userId,'5',opts,callback);
        },
        incrementSubmission,
        makeTempDir,
        moveSource,
        removeTempUpload
    ], function (error, opts) {

        if( error ){

            console.log(error);

            if( typeof error !== 'object' ) return next(new Error(error));

            // user form empty errors
            if( has(error,'formError') ){
                req.flash('formError',error.formError);
                res.redirect('/problems/JOP0' + problemId);
                return;
            }

            if( has(error,'systemError')  ){
                return insertSubmissionIntoDb(problemId,userId,'8',opts,function (err) {
                    if( err ) return next(new Error(error));

                    res.redirect('/status/u/' + problemId);
                });
            }

            return next(new Error(error));
        }

        console.log('Successfully Submitted'.green);
        res.redirect('/status/u/' + problemId);


        //run code against test cases in sandbox
        Judge.run(opts,function(err,runs){
            if( err ){
                console.log('Judge Error!'.red);
                return;
            }

            console.log('successfully run!'.green);
            console.log(runs);
        });
    });
});



/**
 * Get submitted problem's limits from database
 * @param problemId
 * @param callback
 */
var getLimits = function(problemId,callback){

    Problems.findById(problemId,['cpu','memory'],function(err,rows){

        if(err) return callback(err);

        if( rows.length === 0 ) return callback({ formError: '404, no problem found'});

        if( rows === null || rows[0].cpu === null || rows[0].memory === null )
            return callback(null,{ systemError: 'no limit found for this problem!' });

        return callback(null,{
            timeLimit: rows[0].cpu,
            memoryLimit: rows[0].memory
        });
    });
};



/**
 * Get and save multipart form from HTTP request
 * @param uploadedFile
 * @param req
 * @param opts
 * @param cb
 */
var getForm = function(uploadedFile,req,opts,cb){

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
        console.log(('[' + fieldname + '] = ' + val).yellow);
    });


    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        if( filename.length  ){

            console.log((filename +' receieved with mimetype: ' + mimetype).yellow);

            fstream = fs.createWriteStream(uploadedFile + '/code.txt');

            file.on('limit', function() {
                error = 2;
            });

            file.pipe(fstream);
        }else {
            error = 1;
            file.resume();
        }

    });


    busboy.on('finish', function() {

        if( error === 1 ){
            console.log('Submit Source Required'.red);
            return cb({ formError: 'Source Required' });
        }

        if( error === 2 ){
            console.log('Source Size Limit Exceeded'.red);
            return cb({ formError: 'Source Size Limit Exceeded' });
        }


        fstream.on('close', function () {

            console.log('fstream closed');

            if( language  ){
                opts['language'] = language;
                if( has(opts,'systemError') )
                    return cb({ systemError: opts.systemError },opts);

                return cb(null,opts);
            }

            console.log('language Required'.red);
            cb({ formError: 'empty fields of sumission form' });
        });
    });

    req.pipe(busboy);
};


/**
 * Insert submission into database
 * @param problemId
 * @param userId
 * @param submissionStatus
 * @param opts
 * @param callback
 */
var insertSubmissionIntoDb = function (problemId,userId,submissionStatus,opts,callback) {

    Submission.insert({
        pid: problemId,
        uid: userId,
        language: opts.language,
        status: submissionStatus,
        cpu: '0',
        memory: '0'
    },function(err,sid){
        if( err ){
            console.log('Submit inserting error!'.bold.red);
            console.log(err);
            return callback(err);
        }

        opts['submissionId'] = String(sid);
        opts['problemId'] = problemId;
        opts['codeDir'] = MyUtil.SUBMISSION_DIR + '/' + opts.submissionId;
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
            console.log('Updating submission errr'.red);
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
            console.log(opts.codeDir + ' creation failed! permission denied!!'.underline.red);
            return cb(err);
        }
        cb(null,opts);
    });
};


/**
 * Move uploaded code to compiling directory
 * @param uploadedFile
 * @param opts
 * @param cb
 */
var moveSource = function(opts,cb){
    var dest = opts.codeDir + '/code.' + opts.language;
    mv(opts.uploadedFile+'/code.txt', dest, function(err){
        if(err){
            console.log('Moving Source Error'.red);
            return cb(err);
        }
        cb(null,opts);
    });
};


/**
 * Remove our code from our temporary directory after moving to judge run directory , i,e chroot directory
 * @param opts
 * @param cb
 */
var removeTempUpload = function(opts,cb){
    fse.remove(opts.uploadedFile, function (errs) {
        cb(errs,opts);
    });
};

module.exports = router;
