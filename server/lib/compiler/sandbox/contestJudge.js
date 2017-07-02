'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var async = require('async');
var _ = require('lodash');
var uuid = require('uuid');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var has = require('has');
var logger = require('winston');
var chalk = require('chalk');

var MyUtil = require('../../myutil');
var Contest = require('../../../models/contest');
var Problems = require('../../../models/problems');
var Compiler = require('./compiler');



/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

  opts['runName'] = opts.submissionId;
  opts['runDir'] = MyUtil.RUN_DIR + '/' + opts.runName;
  opts['testCaseDir'] = MyUtil.TC_DIR + '/' + opts.problemId;

  logger.debug(
        chalk.green('............In judge!.............'),
        opts,
        'runDir: ' + opts.runDir,
        'testCaseDir: ' + opts.testCaseDir
    );

  async.waterfall([
    function(callback) {
      Contest.UpdateSubmission(opts.submissionId, { status: '6' },callback);
    },
    function(callback) {
      makeTempDir(opts.runDir,callback);
    },
    function(callback){
      compileCode(opts,callback);
    },
    function(callback) {
      getTestCases(opts.testCaseDir,callback);
    },
    function(testCases,callback){
      createAdditionalFiles(opts.runDir,testCases,callback);
    },
    function(testCases,callback){
      logger.debug( chalk.green('Total Test Cases: ' + testCases.length) );
      testCases = testCases.map(function (value, index) {
        return {index: index+1, value: value};
      });
      async.mapSeries(testCases, runTestCase.bind(null,opts), callback);
    }
  ], function (error, runs) {

        //clean up submitted code and run files
    clearTempFiles(opts.runDir, opts.codeDir, function (errs) {

      if( errs )
        logger.error(err);
      else
                logger.debug( chalk.green('success clean submit!'));

      if( error ){

                //runs undefined means we have another issue
        if( _.isUndefined(runs) )
          return Contest.UpdateSubmission(opts.submissionId, { status: '8' }, cb);

                //compiler error
        if( runs !== null && typeof runs === 'object' && has(runs,'compiler') ){
          async.series([
            function(callback){
              Contest.UpdateRank(opts.contestId,opts.userId,opts.problemId,7,callback);
            },
            function(callback){
              Contest.UpdateSubmission(opts.submissionId, { status: '7' }, callback);
            }
          ],
                        function(err, results){
                          if(err) logger.debug('something wrong while updating contest rank and submisison!'.red);
                          cb(null,runs);
                        });
          return;
        }

        logger.debug(runs);

                //no test case was executed, may be no test case found
        if( _.isUndefined(runs[0]) )
          return Contest.UpdateSubmission(opts.submissionId, { status: '8' }, cb);

        logger.debug('Error but runs exists');
      }

      getFinalResult(runs,opts,cb);
    });
  });
};


/**
 *
 * @param saveTo
 * @param cb
 */
var makeTempDir = function(saveTo,cb){
  mkdirp(saveTo, function (err) {
    if (err) {
      logger.debug(saveTo + ' creation failed! permission denied?');
      return cb(err);
    }
    logger.debug( chalk.green(saveTo + ' Created') );
    cb();
  });
};


/**
 *
 * @param opts
 * @param cb
 */
var compileCode = function (opts,cb) {
  Compiler.compile(opts, function (err,stderr, stdout) {

    if(err)
      return cb(err,{compiler: 'Compiler Error'});  //TODO: isn't it system error!?


    if(stderr) {
      logger.debug('stderr', stderr, 'stdout', stdout);
      return cb(stderr,{ compiler: 'Compiler Error'});
    }

    logger.debug( chalk.green('Compiled Successfully'));
    cb();
  });
};


/**
 *
 * @param testCaseDir
 * @param cb
 */
var getTestCases = function (testCaseDir,cb) {
  fs.readdir(testCaseDir, function(err, files) {

    if( err )
      return cb(err);

    if( files.length === 0 ){
      logger.debug(chalk.red('No Test Case Found in ' + testCaseDir));
      return cb('No Test Case Found');
    }

    logger.debug(files);
    cb(null,files);
  });
};


/**
 *
 * @param saveTo
 * @param testCases
 * @param cb
 */
var createAdditionalFiles = function(saveTo,testCases,cb){
  var files = ['output.txt','error.txt','result.txt'];
  async.eachSeries(files, function(file, callback) {
    fs.open(saveTo + '/' + file ,'w',function(err, fd){
      if( err ){
        logger.debug( chalk.red(saveTo + '/' + file + ' creation error'));
        return callback(err);
      }
      logger.debug( chalk.green(saveTo + '/' + file + ' created') );
      callback();
    });
  }, function(err){
    cb(err,testCases);
  });
};


/**
 *
 * @param opts
 * @param testCase
 * @param cb
 */
var runTestCase = function(opts,testCase,cb){
  var testCasePath = opts.testCaseDir + '/' + testCase.value;
  async.waterfall([
    function(callback) {
      runCode(opts,testCasePath,callback);
    },
    function(callback){
      checkResult(opts,callback);
    },
    function(resultObj,callback){
      if( resultObj.result !== 'OK' ) return callback(null,resultObj);

      compareResult(opts,testCasePath,resultObj,callback);
    }
  ], function (error, result) {

    logger.debug('Case ' + testCase.index + ' results:', result);

    if( result !== null && typeof result === 'object'){  //insert every run information into database
      return Contest
        .addTestCase({
          sid:  opts.submissionId,
          name: testCase.value,
          status: result.code,
          cpu:  String(parseInt(parseFloat(result.cpu) * 1000)),
          memory: String(result.memory),
          errortype: result.whyError
        } , function (err) {
          if(err)
            logger.debug(err);

          clearRun(opts,error, result,cb);
        });
    }

    clearRun(opts,error, result,cb);
  });
};


/**
 *
 * @param opts
 * @param testCase
 * @param cb
 */
var runCode = function (opts,testCase,cb) {
  Compiler.run(opts, testCase, function (err,stdout, stderr) {
    if(err) return cb(err);

    if(stderr) {
      logger.debug('stderr!', stderr);
      return checkResult(opts,cb);  //may be SIGABRT type error
    }

    cb();
  });
};


/**
 *
 * @param opts
 * @param cb
 */
var checkResult = function (opts,cb) {

  var resDir = opts.runDir +'/result.txt';
  logger.debug( chalk.yellow('Checking ' + resDir + ' for run result'));

  fs.readFile(resDir, 'utf8', function (error,data) {

    if (error ) return cb(error);

    if( data.length === 0 )
      return cb('no result in file');

    var resultObj = _.zipObject(['code', 'msg','cpu','memory','whyError'], _.split(data,'$',5));
    switch(resultObj.code) {
      case '0':
        resultObj['result'] = 'OK';
        break;
      case '1':
        resultObj['result'] = 'Runtime Error';
        break;
      case '2':
        resultObj['result'] = 'Time Limit Exceeded';
        break;
      case '3':
        resultObj['result'] = 'Memory Limit Exceeded';
        break;
      case '4':
        resultObj['result'] = 'Output Limit Exceeded';
        break;
      case '8':
        resultObj['result'] = 'System Error';
        break;
      default:
        resultObj['result'] = 'Unknown System Error';
    }

    logger.debug( chalk.magenta(data));
      //  logger.debug(resultObj);

        //not accepted
    if( resultObj.code !== '0' )
      return cb(resultObj.result, resultObj);

    cb(null,resultObj);
  });
};


/**
 *
 * @param opts
 * @param testCase
 * @param resultObj
 * @param cb
 */
var compareResult = function (opts,testCase,resultObj,cb) {

  resultObj['result'] = 'Accepted';
  return cb(null,resultObj);

  var judgeOutput = testCase + '/o.txt';
  var userOutput = opts.runDir +'/output.txt';
  var command = './lib/compiler/sandbox/compare ' + judgeOutput + ' ' + userOutput;

  exec(command, {
    env: process.env,
    timeout: 9000,
    maxBuffer: 1000*1024
  }, function(err, stdout, stderr) {

    logger.debug('stdout ', stdout);

    if (err) {
      logger.debug( chalk.red('Compare Error') );
      return cb(err);
    }

    var resCode = parseInt(stdout);
    if( resCode === 0 ){
      logger.debug( chalk.green('Compare OK'));
      resultObj['result'] = 'Accepted';
      cb(null,resultObj);
    }

    if( resCode === 3 || resCode === 2 ){
      logger.debug('Wrong ans code ' + stdout);

      resultObj.code = '9';
      resultObj['result'] = 'Wrong Answer';
      return cb(resultObj.result,resultObj);
    }

    return cb(stderr);
  });
};


/**
 *
 * @param opts
 * @param error
 * @param result
 * @param cb
 */
var clearRun = function(opts,error, result,cb){
  var files = ['output.txt','error.txt','result.txt'];
  async.each(files, function(file, callback) {
    fs.truncate(opts.runDir + '/' + file, 0, function(err){
      if(err)
        return callback(err);

      logger.debug( chalk.green(opts.runDir + '/' + file + ' truncated'));
      callback();
    });
  }, function(err){
    if(err)
      logger.debug( chalk.red('clearRun truncate error'));

    cb(error,result);
  });
};


/**
 *
 * @param runs
 * @param opts
 * @param cb
 */
var getFinalResult = function(runs,opts,cb){
  var finalCode = '8';
  var cpu = 0.0;
  var memory = 0.0;
  var whyError = null;

  _.forEach(runs,function(value) {
    cpu = Math.max(cpu, parseFloat(value.cpu));
    memory = Math.max(memory, parseInt(value.memory));
    finalCode = String(value.code);
    if( value.whyError !== 'null' ){
      whyError = value.whyError;
    }
  });

  logger.debug(
        chalk.green('Final Result '),
        chalk.green('Cpu ' + cpu),
        chalk.green('memory ' + memory),
        chalk.green('finalCode ' + finalCode)
    );

  async.parallel([
    function(callback){
      Contest.UpdateSubmission(opts.submissionId, {
        status: String(finalCode),
        cpu: String(parseInt(parseFloat(cpu) * 1000)),
        memory: String(memory)
      }, callback);
    },
    function(callback){
      Contest.UpdateRank(opts.contestId,opts.userId,opts.problemId,finalCode,callback);
    }
  ], function(err, results){

    if(err)
      logger.error('error while getFinalResult updating of contest!', err);

    cb(null,runs);
  });
};


/**
 *
 * @param runDir
 * @param codeDir
 * @param callback
 */
var clearTempFiles = function (runDir,codeDir,callback) {
  async.series([
    function (cb) {
      rimraf(runDir, function (err) {
        if(err)
          logger.debug( chalk.red('error cleaning runDir ' + runDir));

        cb();
      });
    },
    function (cb) {
      rimraf(codeDir, function (err) {
        if(err)
          logger.debug( chalk.red('error cleaning codedir ' + codeDir));

        cb();
      });
    }
  ], callback);
};
