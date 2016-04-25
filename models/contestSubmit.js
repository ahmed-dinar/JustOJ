var Contest     = require('../models/contest');
var Problems    = require('../models/problems');


var mkdirp      = require('mkdirp');
var _           = require('lodash');
var moment      = require("moment");
var async       = require('async');
var path        = require("path");
var fse         = require('fs-extra');
var fs          = require('fs');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var MyUtil      = require('../helpers/myutil');
var Judge       = require('../helpers/compiler/sandbox/contestJudge');

var colors      = require('colors');

exports.submit = function(req, res, next){

    var cid = req.params.cid;
    var pid = req.params.pid;
    var user = req.user;

    var uploadFile =  MyUtil.UPLOAD_DIR + '/' + uuid.v4() + '.txt';
    var uid = req.user.id;

    async.waterfall([
        function(callback){
            getLimits(pid,callback); //also check valid problem id
        },
        function(opts,callback) {
            getForm(uploadFile,req,opts,callback);
        },
        function(opts,callback){

            var inserts = {
                cid: cid,
                pid: pid,
                uid: uid,
                language: opts.language,
                status: '5',
                cpu: '0',
                memory: '0'
            };

            Contest.InsertSubmission(inserts,function(err,sid){

                if( err ){
                    console.log('Submit inserting error!'.bold.red);
                    console.log(err.red);
                    return callback(err);
                }

                opts['cID'] = cid;
                opts['sID'] = String(sid);
                opts['pID'] = pid;
                opts['uID'] = uid;
                opts['codeDir'] = MyUtil.SUBMISSION_DIR + '/' + opts.sID;
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

        fse.removeSync(uploadFile);

        if( error ){
            if( error.formError ){
                req.flash('formError',error.formError);
                res.redirect('/contest/' + cid + '/problem/' + pid);
                return;
            }
            return next(new Error(error));
        }

        console.log('Submit Successfull'.green);

        res.redirect('/contest/' + cid + '/submissions/my');


        Judge.run(opts,function(err,runs){

            if( err ){
                console.log('Judge Error! damn u'.red);
                return;
            }

            console.log('successfully run!'.green);
            console.log(runs);
        });


    });

};


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


var makeTempDir = function(opts,cb){
    mkdirp(opts.codeDir, function (err) {
        if (err) {
            console.log('OMG ' + opts.codeDir + ' creation failed! permission denied!!'.underline.red);
            return cb(err);
        }
        cb(null,opts);
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
                return cb(null,opts);
            }

            console.log('language Required'.red);
            cb({ formError: 'Empty Field?' });
        });


    });

    req.pipe(busboy);

};


var getLimits = function(pid,callback){

    Problems.findById(pid,['cpu','memory'],function(err,rows){

        if(err){ return callback(err); }

        if( rows.length === 0 ){ return callback({ formError: 'What are u looking for?'});  }

        var opts = {
            timeLimit: rows[0].cpu,
            memoryLimit: rows[0].memory
        };
        callback(null,opts);
    });
};