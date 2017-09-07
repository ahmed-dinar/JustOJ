'use strict';

//
// Module dependencies.
//
var path = require('path');
var fs = require('fs');
var logger = require('winston');
var chalk = require('chalk');
var exec = require('child_process').exec;

var config = require('nconf');
var async = require('async');
var _ = require('lodash');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var has = require('has');

var Compiler = require('./compiler');
var Submission = require('./models/Submission');
var JudgeError = require('./config/judge-error');
var judgeStatus = require('./config/judge-status');


var judgeFiles;


/**
 *
 * judge.path = `{pathToChrootRuns}/submissionid` (will create the folder before compile)
 * judge.id   = submission id
 * judge.source = the source code full path
 *
 *
 * @param opts
 * @param cb
 */
function Judge(job, fn){

  var subId = job.data.id.toString();
  var judge = {
    id: subId,
    path: path.join('/var/SECURITY/JAIL/home/runs', subId), // path.join(config.get('PATH'), job.data.id)
    comparer: './executor/comparator '
  };

  judgeFiles = ['output.txt','error.txt','result.txt'];

  _.forEach(judgeFiles, function(file, indx) {
    judgeFiles[indx] = path.join(judge.path, file);
  });

  var submission = new Submission(judge.id);

  logger.debug(chalk.green('Starting judge submission id ' + judge.id));

  // logger.debug(
  //   chalk.green('............Starting judge.............'),
  //   'path: ' + judge.path,
  //   'judgeFiles: ' + judgeFiles
  // );

  async.waterfall([
    function(callback){
      submission.find(['s.pid','s.status','s.language','p.cpu','p.memory'], function(err, rows){
        if(err){
          return callback(err);
        }
        if(!rows.length){
          return callback(new JudgeError('No Submission Found','NOT_FOUND'));
        }
        judge = _.assign(judge, rows[0]);
        judge.source = path.join(__dirname,'source');

        logger.debug('submission: ', judge);

        return callback();
      });
    },
    function(callback){
      judge.testcasePath = path.join(process.cwd(), 'testcase', judge.pid.toString());
      //logger.debug('testcase path = ', judge.testcasePath);

      fs.readdir(judge.testcasePath, function(err, files) {
        if( err ){
          return callback(err);
        }

        if( !files.length ){
          return callback(new JudgeError('No Test Case Found','NO_TESTCASE'));
        }
       // logger.debug( chalk.green('Total Test Cases: ' + files.length) );

        //make the file list object with full path
        judge.testcases = _.map(files, function makeIndex(value, index){
          return { index: index+1, value: path.join(judge.testcasePath, value.toString()) };
        });

        return callback();
      });
    },
    function(callback){
      submission.put({ status: '6' }, callback);
    },
    async.apply(mkdirp, judge.path),
    async.apply(compile, judge),
    makeFiles,
    async.apply(execute, submission)
  ],
  function (error, runs) {

    rimraf(judge.path, function (err) {
      if( err ){
        logger.error('cleaning after judge error', err);
      }
      else{
        logger.debug( chalk.green('successfully clean submit!'));
      }

      if( error ){
        switch(error.code.toString()){
          case 'COMPILATION_ERROR':
            //logger.debug('COMPILATION_ERROR');
            return submission.put({ status: '7' }, fn);
          case 'SOLUTION_FAILED':
            //logger.debug('SOLUTION_FAILED');
            return makeFinalStatus(runs, submission, judge.pid, fn);
          default:
            logger.error(error);
            return submission.put({ status: '8' }, fn);
        }
      }

      return makeFinalStatus(runs, submission, judge.pid, fn);
    });
  });
};




//
// compiler source code
//
function compile(judge, ignore, fn) {

  var options = _.pick(judge, ['id','language','path','source','cpu','memory']);

  // logger.debug(chalk.green('optons of compiler'), options);
  // logger.debug('judge = ', judge);

  var compiler = new Compiler(options);

  compiler.compile(function (err, stdout, stderr) {
    //TODO: isn't it system error!?
    if(err){
      logger.error(err);
      return fn(new JudgeError('Compilation Error','COMPILATION_ERROR'));
    }

    //TODO: may be save for user why error?
    if(stderr) {
     // logger.debug('stderr', stderr, 'stdout', stdout);
      return fn(new JudgeError('Compilation Error','COMPILATION_ERROR'));
    }

    logger.debug(chalk.green('Source Successfully Compiled'));
    return fn(null, judge, compiler);
  });
};


//
//  Create additional files for saving the run status
//
function makeFiles(judge, compiler, fn){

  async.each(judgeFiles, function(file, callback) {
    fs.open(file, 'w', function(err, fd){
      if( err ){
        logger.debug( chalk.red(file + ' creation error'));
        logger.error(err);
        return callback(err);
      }
      //logger.debug( chalk.green(file + ' created') );
      return callback();
    });
  },
  function(err){
    return fn(err, judge, compiler);
  });
}


//
// Execute the compiled source with all test cases
//
function execute(submission, judge, compiler, fn){

  judge.resultFile = path.join(judge.path, 'result.txt');
  judge.outputFile = path.join(judge.path, 'output.txt');

  //loop through every test cases
  async.mapSeries(judge.testcases, function(testCase, cb){
    //execute source with this test case
    compiler.execute(testCase.value, function(err, stdout, stderr){
      if(err){
        return cb(err);
      }

      //TODO: TEST THIS
      //may be SIGABRT type error for runtime error
      //
      //figured out errors:
      //1. while not using sudo , getting 'chroot error:  Operation not permitted`
      //
      if(stderr) {
        logger.debug('stderr while executing:: ', stderr);
        return checkStatus(judge.resultFile, cb);
      }

      return getStatus(submission, judge, testCase, cb);
    });
  }, fn);
}



//
//
function getStatus(submission, judge, testCase, fn){

  async.waterfall([
    function(callback){
      checkStatus(judge.resultFile, callback);
    },
    function(statusObj, callback){
      compareResult(judge.comparer, judge.outputFile, testCase.value, statusObj, callback);
    }
  ],
  function (error, statusObj) {
   // logger.debug('Case ' + testCase.index + ' status:', statusObj);

    if(error && error.code !== 'SOLUTION_FAILED'){
      return fn(error);
    }

    var hasError = error && error.code === 'SOLUTION_FAILED';
    if(hasError){
      statusObj = error.message;
    //  logger.debug('SOLUTION_FAILED but error.message = ', statusObj);
    }

    //
    // TODO: testCase.value = fullpath, make it only name
    //
    submission.saveCase({
      sid: judge.id,
      name: 'adl;ad',
      status: statusObj.code,
      cpu: parseInt(parseFloat(statusObj.cpu) * 1000),
      memory: statusObj.memory,
      errortype: statusObj.error
    }, function (err) {
      if(err){
        logger.error(err);
      }

      return hasError
        ? fn(error, statusObj)
        : clearRun(statusObj, fn);
    });
  });
}



//
// Check a test case run result
//
function checkStatus(resultPath, fn) {
  //logger.debug(chalk.yellow('Checking ' + resultPath + ' for run result'));

  fs.readFile(resultPath, 'utf8', function (error, data) {
    if (error){
      return fn(error);
    }

    if(!data.length){
      return fn(new JudgeError('Run Result file not found', 'RUN_RESULT_ERROR'));
    }

   // logger.debug( chalk.magenta(data));

    var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
    var statusCode = parseInt(statusObj.code);

    console.log(statusObj);

    var crashed = (statusCode < 0 || statusCode > 4);
    if( crashed ){
      logger.error('code:  ' + statusObj.code + ' || msg: ' + statusObj.msg + ' || error: ' + statusObj.error);
      statusObj.status = statusCode === 8 ? judgeStatus[5] : judgeStatus[6];
      statusObj.code = '8';
    }
    else{
      statusObj.status = judgeStatus[statusCode];
    }

    if( statusCode !== 0 ){
      return fn(new JudgeError(statusObj, 'SOLUTION_FAILED'));
    }

    return fn(null, statusObj);
  });
}



//
// Compare output with judge data
//
function compareResult(comparer, outputFile, testCase, statusObj, fn) {


  var judgeOutput = path.join(testCase, 'o.txt');
  var command = comparer + judgeOutput + ' ' + outputFile;

  console.log('starting comparing...');

  exec(command, {
    env: process.env,
    timeout: 9000,
    maxBuffer: 1000*1024
  },
  function(err, stdout, stderr) {
    if (err) {
      logger.debug( chalk.red('Comparer Error') );
      return fn(err);
    }

    var statusCode = parseInt(stdout);

    if( statusCode === 0 ){
      logger.debug( chalk.green('Compare OK'));
      statusObj.status = 'Accepted';
      return fn(null, statusObj);
    }

    if( statusCode === 9 ){
      logger.debug( chalk.red('Wrong ans code ' + stdout));
      logger.debug( chalk.red(stderr) );

      statusObj.code = '9';
      statusObj.status = 'Wrong Answer';
      statusObj.error = stderr;
      return fn(new JudgeError(statusObj,'SOLUTION_FAILED'));
    }

    return fn(stderr);
  });
}


//
// truncate files for next test case
//
function clearRun(statusObj, fn){
  async.each(judgeFiles, function(file, callback) {
    fs.truncate(file, 0, function(err){
      if(err){
        logger.error('truncate error', err);
        return callback(err);
      }

      logger.debug( chalk.green(file + ' truncated'));
      return callback();
    });
  }, function(err){
    fn(null, statusObj);
  });
}



//
// Make final result by checking all test case result
//
function makeFinalStatus(runs, submission, pid, fn){

  var status = '8';
  var cpu = 0.0;
  var memory = 0.0;
  var whyError = null;

  _.forEach(runs,function(value) {
    cpu = Math.max(cpu, parseFloat(value.cpu));
    memory = Math.max(memory, parseInt(value.memory));
    status = String(value.code);
    if( value.error !== 'null' ){
      whyError = value.error;
    }
  });


  logger.debug(
    chalk.green('Final Result '),
    chalk.green('Cpu ' + cpu),
    chalk.green('memory ' + memory),
    chalk.green('status ' + status)
  );

  async.series([
    function(callback){
      submission.put({
        status: status,
        cpu:  parseInt(parseFloat(cpu) * 1000.0),
        memory: memory
      },
      function(err){
        if(err){
          return callback(err);
        }
        return callback();
      });
    },
    function(callback){
      //TODO: omg stop it! stop it right now!! check problems route, really still in 2017 :(
      //if accepted increment total solved
      if(status === '0'){
        return submission.solved(pid, callback);
      }
      return callback();
    }
  ],
  function(err){
    if(err){
      logger.error('error while makeFinalStatus', err);
    }

    return fn();
  });
};




module.exports = Judge;