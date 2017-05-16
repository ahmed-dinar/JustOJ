'use strict';


var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var fse = require('fs-extra');
var Busboy = require('busboy');
var uuid = require('uuid');
var rimraf = require('rimraf');
var colors = require('colors');
var mv = require('mv');
var has = require('has');

var entities = require('entities');
var Contest = require('../models/contest');
var Problems = require('../models/problems');
var MyUtil = require('../lib/myutil');
var Judge = require('../lib/compiler/sandbox/contestJudge');


exports.submit = function(req, res, next){

    var contestId = req.params.cid;
    var problemId = req.params.pid;
    var user = req.user;

    var uploadName = uuid.v4();
    var codeDir = MyUtil.UPLOAD_DIR + '/' + uploadName;
    var userId = req.user.id;

    async.waterfall([
        function(callback){
            makeTempDir({ codeDir: codeDir }, callback);
        },
        function(opts,callback){
            opts['problemId'] = problemId;
            opts['userId'] = userId;
            opts['contestId'] = contestId;
            getLimits(opts,callback); //also check valid problem id
        },
        function(opts,callback) {
            getForm(req,opts,callback);
        },
        function(opts,callback){
            insertSubmissionIntoDb('5',opts,callback);
        },
        renameSource
    ], function (error, opts) {

        if( error ){

            console.log(error);

            if( typeof error !== 'object' ) return next(new Error(error));

            // user form empty errors
            if( has(error,'formError') ){

                if( error.formError === '404' ) return next(new Error('404'));

                req.flash('formError',error.formError);
                res.redirect('/contests/' + contestId + '/problem/' + problemId);
                return;
            }

            if( has(error,'systemError') ){
                return insertSubmissionIntoDb('8',opts,function (err) {
                    if( err ) return next(new Error(err));

                    res.redirect('/contests/' + contestId + '/problem/' + problemId);
                });
            }

            return next(new Error(error));
        }

        console.log('Submit Successfull'.green);
        res.redirect('/contests/' + contestId + '/submissions/' + opts.submissionId);

        //run code against test cases in sandbox
        Judge.run(opts,function(err,runs){
            if( err ){
                console.log(' contest Judge Error!'.red);
                return;
            }
            console.log('successfully run!'.green);
            console.log(runs);
        });
    });
};


const jsesc = require('jsesc');
/**
 *
 * @param submissionStatus
 * @param opts
 * @param callback
 */
var insertSubmissionIntoDb = function (submissionStatus, opts, callback) {

    async.waterfall([
        function(cb){
            Contest.InsertSubmission({
                cid: opts.contestId,
                pid: opts.problemId,
                uid: opts.userId,
                language: opts.language,
                status: submissionStatus,
                cpu: '0',
                memory: '0'
            },function(err,submissionId){
                if( err ){
                    console.log('Submit inserting error!'.bold.red);
                    return cb(err);
                }
                opts['submissionId'] = String(submissionId);
                cb();
            });
        },
        function(cb){
            if( submissionStatus === '8' ) return cb(null,'');  //system erro, ignore code

            fs.readFile(opts.codeDir + '/code.txt', 'utf8', function(err, submittedCode) {
                if (err){
                    console.log('error reading code file code'.red);
                    return cb(err);
                }
                console.log(submittedCode);
                cb(null,submittedCode);
            });
        },
        function(submittedCode,cb){
            if( submissionStatus === '8' ) return cb();  //system erro, ignore code

            submittedCode = entities.encodeHTML(submittedCode);

            Contest.insertCode({
                sid: opts.submissionId,
                code: submittedCode
            },function(err){
                if(err){
                    console.log('error inserting code'.red);
                    return cb(err);
                }
                cb();
            });
        }
    ], function (error) {
        if(error) console.log(error);
        callback(null,opts);
    });
};


/**
 *
 * @param opts
 * @param cb
 */
var makeTempDir = function(opts,cb){
    mkdirp(opts.codeDir, function (err) {
        if (err) {
            console.log(opts.codeDir + ' creation failed! permission denied!!'.underline.red);
            return cb(err);
        }
        console.log((opts.codeDir + ' Created').green);
        cb(null,opts);
    });
};


/**
 *
 * @param req
 * @param opts
 * @param cb
 */
var getForm = function(req,opts,cb){

    var error = 0;
    var fstream = null;
    var language = null;
    var problemId = null;
    var contestId = null;

    var busboy = new Busboy({
        headers: req.headers,
        limits:{
            files: 1,               //only user code file
            fields: 3,              // language, contestId, problemId
            parts: 4,               //code , language, contestId, problemId
            fileSize: 50000         // (in bytes)
        }
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {

        switch (fieldname){
            case 'problem':
                problemId = val;
                break;
            case 'contest':
                contestId = val;
                break;
            case 'language':
                language = val;
                break;
            default:
             //   language = null;
        }

        console.log(('[' + fieldname + '] = ' + val).yellow);
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        if( filename.length ){

            console.log((filename +' receieved with mimetype: ' + mimetype).yellow);

            fstream = fs.createWriteStream(opts.codeDir + '/code.txt');

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

            if( language ){
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
 *
 * @param opts
 * @param callback
 */
var getLimits = function(opts,callback){
    Problems.findById(opts.problemId,['cpu','memory'],function(err,rows){

        if(err) return callback(err);

        if( rows.length === 0 ) return callback({ formError: '404'});

        if( rows === null || rows[0].cpu === null || rows[0].memory === null )
            return callback(null,{ systemError: 'no limit found for this problem!' });

        opts['timeLimit'] = rows[0].cpu;
        opts['memoryLimit'] = rows[0].memory;
        return callback(null, opts);
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
            console.log('ERROR renaming: ');
            console.log(err);
            return cb({ systemError: 'error renaming code file' },opts);
        }
        cb(null,opts);
    });
};