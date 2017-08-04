'use strict';

var fs = require('fs');
var Busboy = require('busboy');
var mkdirp = require('mkdirp');
var async = require('async');
var entities = require('entities');
var logger = require('winston');
var crypto = require('crypto');
var chalk = require('chalk');
var path = require('path');

var AppError = appRequire('lib/custom-error');
var Problems = appRequire('models/problems');
var Submission = appRequire('models/api/Submission');


module.exports = function(req, res, next) {

  logger.debug('submission body = ', req.body);

  var problemId = req.body.problemId;
  var userId = req.user.id;

  var UPLOAD_DIR = path.join(process.cwd(), '..', 'judger', 'source');

  async.waterfall([
    function(callback){
      Problems.findById(problemId, ['cpu','memory'], function(err,rows){
        if(err){
          return callback(err);
        }

        if(!rows || !rows.length){
          return callback(new AppError('No Problem Found','404'));
        }

        if(!rows[0].cpu || rows[0].cpu === undefined || !rows[0].memory || rows[0].memory === undefined){
          return callback(new Error('Problem CPU or Memory Not Found'));
        }

        return callback(null, {
          userId: userId,
          problemId: problemId
        });
      });
    },
    function(submission, callback){
      crypto.randomBytes(20, function(err, buffer) {
        if(err){
          return callback(err);
        }
        //unique safe directory name
        submission.token = buffer.toString('hex');
        //absolute path of source code
        submission.source = path.join(UPLOAD_DIR, submission.token);

        return callback(null, submission);
      });
    },
    function(submission, callback){
      mkdirp(submission.source, function (err) {
        if (err) {
          logger.debug(chalk.red(submission.source + ' creation failed! permission denied!!'));
          return callback(err);
        }
        logger.debug(chalk.green(submission.source + ' Created'));
        callback(null, submission);
      });
    },
    function(submission, callback) {
      getForm(req, submission, callback);
    },
    saveSubmission,
    incrementSubmission,
    renameSource
  ],
  function (error, submissionId) {
    if( error ){
      if(error.name === '404'){
        return res.status(404).json({ error: error.message });
      }

      if(error.name === 'input'){
        return res.status(400).json({ error: error.message });
      }

      logger.debug(error);
      return res.sendStatus(500);
    }
    logger.debug(chalk.green('Successfully Submitted'));

    res.status(200).json(submissionId);
  });
};





//
//Get and save multipart form from HTTP request
//
var getForm = function(req, submission, fn){

  var error = 0;
  var fstream = null;
  var language = null;

  var busboy = new Busboy({
    headers: req.headers,
    limits:{
      files: 1,               //only user source file
      fields: 1,              //only language
      parts: 2,               //source and language
      fileSize: 50000         // (in bytes)
    }
  });

  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
    language = val;
    logger.debug(chalk.yellow('[' + fieldname + '] = ' + val));
  });


  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    //no file uploaded
    if( !filename.length ){
      error = 1;
      file.resume();
      return;
    }
    logger.debug(chalk.yellow(filename +' receieved with mimetype: ' + mimetype));

    fstream = fs.createWriteStream(path.join(submission.source,'code.txt'));

    //source size limit
    file.on('limit', function() {
      error = 2;
    });

    file.pipe(fstream);
  });


  busboy.on('finish', function() {
    if( error === 1 ){
      logger.debug(chalk.red('Submit Source Required'));
      return fn(new AppError('Source Required','input'));
    }

    if( error === 2 ){
      logger.debug(chalk.red('Source Size Limit Exceeded'));
      return fn(new AppError('Source Size Limit Exceeded','input'));
    }

    fstream.on('close', function () {
      logger.debug('fstream closed');

      if( !language ){
        logger.debug(chalk.red('language Required'));
        return fn(new AppError('language required','input'));
      }

      submission.language = language;
      submission.status = '5';
      return fn(null, submission);
    });
  });

  req.pipe(busboy);
};


//
// save source code into database
//
function saveSubmission(submission, fn){

  async.waterfall([
    function(callback){
      Submission.save({
        pid: submission.problemId,
        uid: submission.userId,
        language: submission.language,
        status: submission.status,
        cpu: 0,
        memory: 0
      },function(err, sid){
        if( err ){
          logger.debug(chalk.red('inserting Submission error'));
          return callback(err);
        }

        submission.id = sid;
        return callback();
      });
    },
    function(callback){
      fs.readFile(path.join(submission.source,'code.txt'), 'utf8', function(err, sourceCode) {
        if (err){
          logger.debug(chalk.red('error reading source file code'));
          return callback(err);
        }
        //logger.debug(sourceCode);
        return callback(null, sourceCode);
      });
    },
    function(sourceCode, callback){
      Submission.saveSource({
        sid: submission.id,
        code: entities.encodeHTML(sourceCode)
      },
      function(err){
        if(err){
          logger.debug(chalk.red('error inserting source code'));
          return callback(err);
        }
        return callback(null, submission);
      });
    }
  ], fn);
}


//
// increment Submission count of this problem
//
var incrementSubmission = function (submission, callback) {
  Problems.updateSubmission(submission.problemId, 'submissions', function(err){
    if( err ){
      logger.debug(chalk.red('Updating submission errr'));
      return callback(err);
    }
    callback(null, submission);
  });
};


//
// rename source using languge extension
//
var renameSource = function(submission, fn) {
  var oldPath = path.join(submission.source,'code.txt');
  var newPath = path.join(submission.source, 'code.'+submission.language);

  fs.rename(oldPath, newPath, function(err) {
    if ( err ) {
      //set the submission status as system error
      return Submission.put(submission.id, { status: '8' }, function(error){
        //damn man!
        if(error){
          logger.debug('update submission status error');
          logger.error(error);
        }
        logger.debug('Error Renaming Source');
        return fn(err);
      });
    }

    return fn(null, submission.id);
  });
};
