'use strict';

var fs = require('fs');
var async = require('async');
var entities = require('entities');
var logger = require('winston');
var chalk = require('chalk');
var path = require('path');
var has = require('has');
var Hashids = require('hashids');
var config = require('nconf');
var moment = require('moment');

var Judge = appRequire('worker/Judge');
var Contest = appRequire('models/contest');
var Problems = appRequire('models/problems');
var handleError = appRequire('lib/handle-error');
var upload = appRequire('middlewares/sourceUpload').single('source');

var problemHash = new Hashids(config.get('HASHID:PROBLEM'), 11);
const baseSourcePath = path.join(process.cwd(), '..', 'judger', 'source');


function Submit(req, res){

  var problemId = problemHash.decode(req.params.pid);
  if(!problemId || !problemId.length){
    return res.status(404).json({ error: 'No Problem Found' });
  }

  var sourcePath = null;

  async.waterfall([
    function validateContest(callback){
      Contest.announcement(req.contestId, req.user.id, function(err, data){
        if(err){
          return callback(err);
        }
        if(!data.length){
          return callback(new AppError('No Contest Found', 'NOT_FOUND'));
        }
        data = data[0];

        //contest is not public
        if( parseInt(data.status) !== 2 ){
          return callback(new AppError('Conest is not public', 'FORBIDDEN'));
        }

        //contest is not running, no more submission
        if( !moment().isBetween(data.begin, data.end) ){
          return callback(new AppError('Contest Is not running','FORBIDDEN'));
        }

        return callback();
      });
    },
    function validateProblem(callback){
      Problems.findById(problemId, ['cpu','memory'], function(err,rows){
        if(err){
          return callback(err);
        }

        if(!rows || !rows.length){
          return callback(new AppError('No Problem Found','NOT_FOUND'));
        }

        if(!rows[0].cpu || rows[0].cpu === undefined || !rows[0].memory || rows[0].memory === undefined){
          return callback(new Error('Problem CPU or Memory Not Found'));
        }

        return callback(null, {
          contestId: req.contestId,
          userId: req.user.id,
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
          return callback(new AppError('Source Required','BAD_REQUEST'));
        }
        sourcePath = req.file.path;

        if( !has(req.body,'language') ){
          return callback(new AppError('Language Required','BAD_REQUEST'));
        }

        submission.source = sourcePath;
        submission.language = req.body.language;
        submission.status = '5';

        return callback(null, submission);
      });
    },
    saveAndRename
  ],
  function(error, submissionId){

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
    Judge.push({ id: submissionId }, 'contest', function(err){
      if(err){
        logger.error('judge push submission error', err);
      }else{
        logger.info('queued submission of id = ' + submissionId);
      }

      res.status(200).json(submissionId);
    });
  });
}



//
// save source code into database
//
function saveAndRename(submission, fn){

  async.waterfall([
    function(callback){
      Contest.saveSubmission({
        cid: submission.contestId,
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
      Contest.saveSource({
        sid: submission.id,
        code: entities.encodeHTML(sourceCode)
      },
      function(err){
        if(err){
          logger.debug(chalk.red('error inserting source code'));
          return callback(err);
        }
        return callback();
      });
    },
    function(callback){

      var newName = path.join(baseSourcePath, ('contest_'+submission.id+'.'+submission.language).toString());

      fs.rename(submission.source, newName, function(err) {
        if ( err ) {

          //set the submission status as system error
          return Contest.putSubmission(submission.id, { status: '8' }, function(error){

            //damn man!
            if(error){
              logger.debug('update submission status error');
              logger.error(error);
            }

            logger.debug('Error Renaming Source');
            return callback(err);
          });
        }

        return callback(null, submission.id);
      });
    }
  ], fn);
}




module.exports = Submit;