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

var isLoggedIn  = require('../middlewares/isLoggedIn');
var Judge       = require('../helpers/compiler/sandbox/judge');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var Submission  = require('../models/submission');
var User        = require('../models/user');

var colors      = require('colors');


router.post('/:pid', isLoggedIn(true), function(req, res, next) {


    var uploadFile =  MyUtil.UPLOAD_DIR + '/' + uuid.v4() + '.txt';

    var pID = req.params.pid;
    var uID = String(req.user.id);

    async.waterfall([
        function(callback){
            getLimits(pID,callback); //also check valid problem id
        },
        function(opts,callback) {
            getForm(uploadFile,req,opts,callback);
        },
        function(opts,callback){

            var inserts = {
                pid: pID,
                uid: uID,
                language: opts.language,
                status: '5',
                cpu: '0',
                memory: '0'
            };
            Submission.insert(inserts,function(err,sid){

                if( err ){
                    console.log('Submit inserting error!'.bold.red);
                    console.log(err.red);
                    return callback(err);
                }

                opts['sID'] = String(sid);
                opts['pID'] = pID;
                opts['codeDir'] = MyUtil.SUBMISSION_DIR + '/' + opts.sID;
                callback(null,opts);
            });

        },
        function(opts,callback){

            Problems.updateSubmission(pID, 'submissions', function(err){
                if( err ){
                    console.log('Updating submission errr'.red);
                    return callback(err);
                }

                callback(null,opts);
            });
        },
        function(opts,callback){
            makeTempDir(opts,callback);
        },
        function(opts,callback){
            moveSource(uploadFile,opts,callback);
        }
    ], function (error, opts, sid) {

        fse.remove(uploadFile, function (errs) {
            if (errs) { console.log(errs); }


            if( error ){

                console.log(error);

                // user form empty errors
                if( error.formError ){

                    req.flash('formError',error.formError);
                    res.redirect('/problems/JOP0' + pID);

                }else if( error.sysError ){ //system errors

                    var inserts = {
                        pid: pID,
                        uid: uID,
                        language: opts.language,
                        status: '8',
                        cpu: '0',
                        memory: '0'
                    };
                    Submission.insert(inserts,function(err,sid){

                        if( err ){
                            console.log('Submit inserting error!'.bold.red);
                            console.log(err.red);
                            return next(new Error(err));
                        }

                        res.redirect('/status/u/' + pID);
                    });

                }else {
                    return next(new Error(error));
                }
            }else{

                console.log('Submit Successfull'.green);

                res.redirect('/status/u/' + pID);

                Judge.run(opts,function(err,runs){

                    if( err ){
                        console.log('Judge Error! damn u'.red);
                        return;
                    }

                    console.log('successfully run!'.green);
                    console.log(runs);
                });
            }

        });
    });
});


var moveSource = function(uploadFile,opts,cb){
    var dest = opts.codeDir + '/code.' + opts.language;
    fse.move(uploadFile, dest, function(err){
        if(err){
            console.log('Moving Source Error'.red);
            return cb(err);
        }
        cb(null,opts);
    });
};

var getLimits = function(pid,callback){

    Problems.findById(pid,['cpu','memory'],function(err,rows){

        if(err){ return callback(err); }

        if( rows.length === 0 ){ return callback({ formError: '404, no problem found'});  }

        var opts = {
            timeLimit: rows[0].cpu,
            memoryLimit: rows[0].memory
        };

        if( rows === null || rows[0].cpu === null || rows[0].memory === null ){
            opts['sysError'] = true;
        }

        callback(null,opts);
    });
};


var getForm = function(uploadFile,req,opts,cb){

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

            fstream = fs.createWriteStream(uploadFile);

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

                if( opts.sysError ){ return cb({sysError: 'no limits found!'},opts); }

                return cb(null,opts);
            }

            console.log('language Required'.red);
            cb({ formError: 'Empty Field?' });
        });


    });

    req.pipe(busboy);

};







var makeTempDir = function(opts,cb){
    mkdirp(opts.codeDir, function (err) {
        if (err) {
            console.log('OMG ' + opts.codeDir + ' creation failed! permission denied!!'.underline.red);
            return cb(err);
        }
        cb(null,opts);
    });
};


module.exports = router;
