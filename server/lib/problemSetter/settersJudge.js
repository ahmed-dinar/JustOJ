'use strict';

/**
 * Module dependencies.
 */


var exec = require('child_process').exec;

var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var rimraf = require('rimraf');
var logger = require('winston');
var chalk = require('chalk');

var AppError = appRequire('lib/custom-error');
var Compiler = appRequire('lib/compiler/sandbox/compiler');


/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

   // opts['runDir']  = MyUtil.RUN_DIR + '/' + opts.runName;

  logger.debug(opts);
  logger.debug('runDir: ' + opts.runDir);
  logger.debug('tcDir: ' + opts.tcDir);

  async.waterfall([
    function(callback){
      compileCode(opts,callback);
    },
    function(callback) {
      getTestCases(opts.tcDir,callback);
    },
    function(testCases,callback){
      createAdditionalFiles(opts.runDir,testCases,callback);
    },
    function(testCases,callback){
      logger.debug( chalk.green('Total Test Cases: ' + testCases.length) );

      testCases = _.map(testCases, function(caseItem, itemIndex){
        return { id: itemIndex + 1, case: caseItem };
      });

      async.mapSeries(testCases, runTestCase.bind(null,opts), callback);
    }
  ], function (error, runs) {

    rimraf(opts.runDir, function (err) {

      if( err ){
        logger.error(err);
      }

      logger.debug( chalk.green('success clean submit!') );

      if( error ){
        logger.error(error);

        if(error.name === 'compiler'){
          return cb(error, runs);
        }

        //no idea when and why use undefined!!
        if( !runs || !runs.length || runs[0] === undefined ){
          return cb(error, {});
        }

        logger.debug('Error but runs exists');
        logger.debug(runs);
      }

      return getFinalResult(runs, opts, cb);
    });
  });
};


/**
 *
 * @param opts
 * @param cb
 */
var compileCode = function (opts,cb) {
  Compiler.compile(opts, function (err,stderr, stdout) {

    //is it OK?
    if(err || stderr){
      logger.debug(err);
      logger.debug(stderr);
      return cb(new AppError('Compilation Error', 'compiler'));
    }

    logger.debug( chalk.green('Compiled Successfully') );
    cb();
  });
};


/**
 * Get available test cases for this problem
 * @param tcDir
 * @param cb
 */
var getTestCases = function (tcDir,cb) {
  fs.readdir(tcDir, function(err, files) {
    //why!
    if( err ){
      logger.error(err);
      return cb(err, {});
    }

    //should be system error?
    if( files.length === 0 ){
      logger.debug( chalk.red('No Test Case Found in ' + tcDir) );
      return cb('No Test Case Found', {});
    }

    logger.debug(files);
    cb(null, files);
  });
};


/**
 * Create result, error and output file for store runs result
 * @param saveTo
 * @param testCases
 * @param cb
 */
var createAdditionalFiles = function(saveTo,testCases,cb){
  var files = ['output.txt','error.txt','result.txt'];

  async.eachSeries(files, function(file, callback) {
    fs.open(saveTo + '/' + file ,'w',function(err, fd){
      if( err ){
        logger.debug( chalk.red(saveTo + '/' + file + ' creation error') );
        return callback(err);
      }

      logger.debug( chalk.green(saveTo + '/' + file + ' created') );
      callback();
    });
  },
  function(err){
    cb(err, testCases);
  });
};


/**
 * Run program under a specific test case
 * @param opts
 * @param testCase
 * @param cb
 */
var runTestCase = function(opts,testCase,cb){

  var caseId = testCase.id;
  testCase = opts.tcDir + '/' + testCase.case;

  async.waterfall([
    function(callback) {
      runCode(opts,testCase, caseId, callback);
    },
    function(ignore, callback){
      logger.debug('ignore = ' + ignore);
      if(ignore !== false){
        return callback(null, ignore);
      }
      checkResult(opts, caseId, callback);
    },
    function(resultObj,callback){
      //one test case failed, ignore others
      if( resultObj.result !== 'OK' ){
        return callback(null, resultObj);
      }

      return compareResult(opts,testCase,resultObj,callback);
    }
  ],
  function (error, result) {
    return clearRun(opts, error, result, cb);
  });
};


/**
 * Run program under chroot sandbox
 * @param opts
 * @param testCase
 * @param cb
 */
var runCode = function (opts, testCase, caseId, cb) {
  Compiler.run(opts, testCase, function (err,stdout, stderr) {
    if(err){
      return cb(err);
    }

    if(stderr) {
      logger.debug('stderr occured!', stderr);
      return checkResult(opts, caseId, cb);
    }
    cb(null, false);
  });
};


/**
 * Check result file in chroot directory
 * @param opts
 */
var checkResult = function (opts, caseId, fn) {

  var resDir = opts.runDir +'/result.txt';
  logger.debug( chalk.yellow('Checking ' + resDir + ' for run result'));

  fs.readFile(resDir, 'utf8', function (error,data) {
    if (error ){
      return fn(error);
    }

    if( data.length === 0 ) {
      logger.debug( chalk.red('Why result file empty?'));
      return fn('no result in file');
    }


    var resultObj = _.zipObject(['code', 'msg','cpu','memory','whyError'], _.split(data,'$',5));
    //serial index
    resultObj.id = caseId;

    var runResCode = parseInt(resultObj.code);
    switch(runResCode) {
      case 0:
        resultObj['result'] = 'OK';
        break;
      case 1:
        resultObj['result'] = 'Runtime Error';
        break;
      case 2:
        resultObj['result'] = 'Time Limit Exceeded';
        break;
      case 3:
        resultObj['result'] = 'Memory Limit Exceeded';
        break;
      case 4:
        resultObj['result'] = 'Output Limit Exceeded';
        break;
      case 5:
        resultObj['result'] = 'System Error';
        break;
      default:
        resultObj['result'] = 'Unknown System Error';
    }

    logger.debug( chalk.magenta(data), resultObj);

    if( runResCode !== 0 ){
      return fn(resultObj.result, resultObj);
    }

    return fn(null, resultObj);
  });
};


/**
 * Compare user output with judge data
 * @param opts
 * @param testCase
 * @param resultObj
 * @param cb
 */
var compareResult = function (opts,testCase,resultObj,cb) {

  var judgeOutput = testCase + '/o.txt';
  var userOutput = opts.runDir +'/output.txt';
  var command = './lib/compiler/sandbox/compare ' + judgeOutput + ' ' + userOutput;

  exec(command, {
    env: process.env,
    timeout: 9000,
    maxBuffer: 1000*1024
  }, function(err, stdout, stderr) {

    if (err) {

      if( err.code === 2 || err.code === 3 ){

        logger.debug('Wrong ans code ' + err.code);
        logger.debug(chalk.red(stdout));

        resultObj.code = '9';
        resultObj['result'] = 'Wrong Answer';
        return cb(resultObj.result,resultObj);
      }

      logger.debug( chalk.red('Compare Error'), err);

      return cb(err);
    }

    logger.debug( chalk.green('Compare OK'));

    resultObj['result'] = 'Accepted';
    cb(null,resultObj);
  });

};


/**
 * truncate current test case runs file for next test case
 * @param opts
 * @param error
 * @param result
 * @param cb
 */
var clearRun = function(opts, error, result,cb){
  var files = ['output.txt','error.txt','result.txt'];
  async.each(files, function(file, callback) {
    fs.truncate(opts.runDir + '/' + file, 0, function(err){
      if(err){
        return callback(err);
      }

      logger.debug( chalk.green(opts.runDir + '/' + file + ' truncated'));
      callback();
    });
  }, function(err){
    if( err ){
      logger.error( chalk.red('clearRun Error') );
    }

    return cb(error,result);
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
  var result = 'Accepted';
  var whyError = null;

  var fres = {};
  var fparts = [];

  _.forEach(runs,function(value) {
    cpu = Math.max(cpu, parseFloat(value.cpu));
    memory = Math.max(memory, parseInt(value.memory));
    finalCode = value.code;
    result = value.result;
    if( value.whyError !== 'null' ){
      whyError = value.whyError;
    }
    fparts.push(value);
  });

  fres['runs'] = fparts;
  fres['final'] = {
    code: finalCode,
    cpu: cpu,
    memory: memory,
    result: result,
    language: opts['language'],
    whyError: whyError
  };


  logger.debug(
        chalk.green('Final Result '),
        chalk.green('Cpu: ' + cpu),
        chalk.green('memory: ' + memory),
        chalk.green('Code: ' + finalCode),
        chalk.green('result: ' + result)
    );


  cb(null,fres);
};
