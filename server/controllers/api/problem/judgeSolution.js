'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var Busboy = require('busboy');
var uuid = require('uuid');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var async = require('async');
var logger = require('winston');
var has = require('has');
var chalk = require('chalk');
var path = require('path');

var AppError = appRequire('lib/custom-error');
var MyUtil = appRequire('lib/myutil');
var Judge = appRequire('lib/problemSetter/settersJudge');


module.exports = function(req, res, next) {

  var uploadName = uuid.v4();
  var uploadFile = MyUtil.RUN_DIR + '/' + uploadName;
  var pID = req.body.problem.id;

  async.waterfall([
    function(callback){
      makeTempDir(uploadFile,callback);
    },
    function(callback) {
      getForm(uploadFile,req,callback);
    },
    function(opts,callback){
      fs.rename(uploadFile+'/code.txt', uploadFile+'/code.' + opts['language'], function(err){
        if(err ){
          return callback(err);
        }
        return callback(null,opts);
      });
    },
    function(opts,callback){

      opts['runName'] = uploadName;
      opts['runDir'] = uploadFile;
      opts['pID'] = pID;
      opts['tcDir'] = path.join(process.cwd(), '..', 'judger', 'testcase', pID.toString());
      opts['codeDir'] = uploadFile;

      logger.debug(chalk.green('calling Judge runner..........'));

      Judge.run(opts, callback);
    }
  ], function (error, runs) {

    cleanSubmit(uploadFile, function (err) {

      if( error ){
        if(error.name === 'input'){
          return res.status(400).json({ error: error.message });
        }

        if(error.name === 'compiler'){
          var resJ = { id: 1, cpu: 0, memory: 0, status: 'Compilation Error', code: 7 };
          return res.status(200).json({
            final: resJ,
            runs: null
          });
        }

        logger.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      logger.debug(runs);
      return res.status(200).json(runs);
    });
  });
};


//
// fetch form and files
//
var getForm = function(uploadFile,req,cb){

  var error = 0;
  var fstream = null;
  var limits = {};
  var opts = {};

  var busboy = new Busboy({
    headers: req.headers,
    limits:{
      files: 1,               //only user code file
      fields: 2,              //time limit and language
      parts: 3,               //files and fields
      fileSize: 50000         // (in bytes)
    }
  });


  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
    limits[fieldname] = val;
    logger.debug(chalk.yellow('[' + fieldname + '] = ' + val));
  });


  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

    if( filename.length ){

      logger.debug(chalk.yellow(filename +' receieved with mimetype: ' + mimetype));

      fstream = fs.createWriteStream(uploadFile + '/code.txt');

      file.on('limit', function() {
        error = 2;
      });

      file.pipe(fstream);
    }else {
      //no file uploaded or include, abroad stream
      error = 1;
      file.resume();
    }

  });


  busboy.on('finish', function() {

    if( error === 1 ){
      logger.debug(chalk.red('Submit Source Required'));
      return cb(new AppError('Source required', 'input'));
    }

    if( error === 2 ){
      logger.debug(chalk.red('Source Size Limit Exceeded'));
      return cb(new AppError('Source Size Limit Exceeded', 'input'));
    }

    fstream.on('close', function () {
      logger.debug('fstream closed');

      if( !has(limits,'cpu') ){
        logger.debug(chalk.red('cpu Field Required'));
        return cb(new AppError('Time Limit required', 'input'));
      }

      if( !has(limits,'language') ){
        logger.debug(chalk.red('language Field Required'));
        return cb(new AppError('Language required', 'input'));
      }

      opts.language = limits.language;
      opts.timeLimit = parseInt(parseFloat(limits['cpu']) * 1000.0);
      //deal with it
      opts.memoryLimit = 256;

      return cb(null,opts);
    });
  });

  req.pipe(busboy);
};


//
// make a temporary diretory to upload and save the solution file
//
function makeTempDir(saveTo,cb){
  mkdirp(saveTo, function (err) {
    if (err) {
      logger.debug('OMG ' + saveTo + ' creation failed! permission denied!!');
      return cb(err);
    }
    logger.debug(chalk.green(saveTo + ' Created'));
    cb();
  });
};



//clean up submitted code and run files
function cleanSubmit(codeDir, cb){
  rimraf(codeDir, function (err) {
    if( err ){
      logger.debug(err);
      return cb(err);
    }
    logger.debug(chalk.green('success clean submit!'));
    cb();
  });
}
