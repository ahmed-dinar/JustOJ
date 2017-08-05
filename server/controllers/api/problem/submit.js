'use strict';

var fs = require('fs');
var async = require('async');
var entities = require('entities');
var logger = require('winston');
var chalk = require('chalk');
var path = require('path');
var has = require('has');


var AppError = appRequire('lib/custom-error');
var Problems = appRequire('models/problems');
var Submission = appRequire('models/api/Submission');
var upload = appRequire('middlewares/sourceUpload').single('source');
var Judge = appRequire('worker/Judge');



module.exports = function(req, res, next) {

  var problemId = req.body.problemId;
  var userId = req.user.id;
  var sourcePath = null;

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
      upload(req, res, function (err) {
        if (err) {
          return callback(err);
        }

        if( !has(req,'file') || !req.file ){
          return callback(new AppError('Source Required','input'));
        }
        sourcePath = req.file.path;

        if( !has(req.body,'language') ){
          return callback(new AppError('Language Required','input'));
        }

        submission.source = sourcePath;
        submission.language = req.body.language;
        submission.status = '5';

        return callback(null, submission);
      });
    },
    saveSubmission,
    incrementSubmission,
    renameSource
  ],
  function (error, submissionId) {
    if( error ){
      if( !sourcePath ){
        return handleError(error, res);
      }

      return fs.unlink(sourcePath, function(err){
        if(err){
          logger.error(err);
        }
        return handleError(error, res);
      });
    }
    logger.debug(chalk.green('Successfully Submitted'));

    //push the submission into judge queue
    Judge.push({ id: submissionId }, function(err){
      if(err){
        logger.error('judge push submission error', err);
      }else{
        logger.info('queued submission of id = ' + submissionId);
      }

      res.status(200).json(submissionId);
    });
  });
};


//
//
//
function handleError(error, res){

  logger.debug(error);

  if(error.name === '404'){
    return res.status(404).json({ error: error.message });
  }

  if(error.name === 'input'){
    return res.status(400).json({ error: error.message });
  }


  var uploadErrors = {
    'LIMIT_PART_COUNT': 'Too many parts',
    'LIMIT_FILE_SIZE': 'Source size limit exceeded',
    'LIMIT_FILE_COUNT': 'Only one source allowed',
    'LIMIT_FIELD_KEY': 'Field name too long',
    'LIMIT_FIELD_VALUE': 'Language value too long',
    'LIMIT_FIELD_COUNT': 'Only language allowed',
    'LIMIT_UNEXPECTED_FILE': 'Unexpected input'
  };

  if( has(uploadErrors, error.code) ){
    return res.status(404).json({ error: uploadErrors[error.code] });
  }

  logger.error(error);
  return res.sendStatus(500);
}


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
      fs.readFile(submission.source, 'utf8', function(err, sourceCode) {
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
      logger.debug(chalk.red('Updating submission error'));
      return callback(err);
    }
    callback(null, submission);
  });
};


//
// rename source using languge extension
//
var renameSource = function(submission, fn) {

  //should be edited
  var newName = path.join(process.cwd(), '..', 'judger', 'source', (submission.id+'.'+submission.language));

  fs.rename(submission.source, newName, function(err) {
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
