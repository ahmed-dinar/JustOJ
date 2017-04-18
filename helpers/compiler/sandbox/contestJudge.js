
var path        = require('path');
var fs          = require('fs');
var exec        = require('child_process').exec;

var async       = require('async');
var _           = require('lodash');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var mkdirp      = require('mkdirp');
var has         = require('has');

var MyUtil      = require('../../myutil');
var Contest     = require('../../../models/contest');
var Problems    = require('../../../models/problems');
var Compiler    = require('./compiler');

var colors      = require('colors');


/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

    opts['runName'] = opts.submissionId;
    opts['runDir']  = MyUtil.RUN_DIR + '/' + opts.runName;
    opts['testCaseDir']   = MyUtil.TC_DIR + '/' + opts.problemId;

    console.log('In judge!............................'.green);
    console.log(opts);
    console.log('runDir: ' + opts.runDir);
    console.log('testCaseDir: ' + opts.testCaseDir);

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
            console.log(('Total Test Cases: ' + testCases.length).green);
            testCases = testCases.map(function (value, index) {
                return {index: index+1, value: value};
            });
            async.mapSeries(testCases, runTestCase.bind(null,opts), callback);
        }
    ], function (error, runs) {

        //clean up submitted code and run files
        clearTempFiles(opts.runDir, opts.codeDir, function (errs) {

            if( errs ) console.log(err);
            else console.log('success clean submit!'.green);

            if( error ){

                //runs undefined means we have another issue
                if( _.isUndefined(runs) )
                    return Contest.UpdateSubmission(opts.submissionId, { status: '8' }, cb);

                //compiler error
                if( runs !== null && typeof runs === 'object' &&  has(runs,'compiler') ){
                    async.series([
                            function(callback){
                                Contest.UpdateRank(opts.contestId,opts.userId,opts.problemId,7,callback);
                            },
                            function(callback){
                                Contest.UpdateSubmission(opts.submissionId, { status: '7' }, callback);
                            }
                        ],
                        function(err, results){
                            if(err) console.log('something wrong while updating contest rank and submisison!'.red);
                            cb(null,runs);
                        });
                    return;
                }

                console.log('ooo');
                console.log(runs);

                //no test case was executed, may be no test case found
                if( _.isUndefined(runs[0]) )
                    return Contest.UpdateSubmission(opts.submissionId, { status: '8' }, cb);

                console.log('Error but runs exists');
                console.log(runs);
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
            console.log('OMG ' + saveTo + ' creation failed! permission denied!!');
            return cb(err);
        }
        console.log((saveTo + ' Created').green);
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

        if(err) return cb(err,{compiler: 'Compiler Error'});  //TODO: isn't it system error!?


        if(stderr) {
            console.log('stderr');
            console.log(stderr);
            console.log('stdout');
            console.log(stdout);
            return cb(stderr,{ compiler: 'Compiler Error'})
        };

        console.log(('Compiled Successfully').green);
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

        if( err ){
            console.log('getTestCases error:: '.red);
            console.log(err);
            return cb(err);
        }


        if( files.length === 0 ){
            console.log(('No Test Case Found in ' + testCaseDir).red);
            return cb('No Test Case Found');
        }

        console.log(files);

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
                console.log((saveTo + '/' + file + ' creation error').red);
                return callback(err);
            }
            console.log((saveTo + '/' + file + ' created').green);
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

        console.log('Case ' + testCase.index  + ' results:');
        console.log(result);


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
                    if(err) console.log(err);

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
            console.log('stderr!');
            console.log(stderr);
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
    console.log(('Checking ' + resDir + ' for run result').yellow);

    fs.readFile(resDir, 'utf8', function (error,data) {

        if (error ) return cb(error);

        if( data.length === 0 ) return cb('no result in file');

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

        console.log(data.magenta);
      //  console.log(resultObj);

        if( resultObj.code !== '0' ) return cb(resultObj.result, resultObj);  //not accepted

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
    var userOutput  = opts.runDir +'/output.txt';
    var command =  './helpers/compiler/sandbox/compare ' + judgeOutput + ' ' + userOutput;

    exec(command, {
        env: process.env,
        timeout: 9000,
        maxBuffer: 1000*1024
    }, function(err, stdout, stderr) {

        console.log('stdout ' + stdout);


        if (err) {

            console.log('Compare Error'.red);
            console.log(err);

            return cb(err);
        }


        var resCode = parseInt(stdout);

        if( resCode === 0 ){
            console.log('Compare OK'.green);
            resultObj['result'] = 'Accepted';
            cb(null,resultObj);
        }


        if( resCode === 3 || resCode === 2 ){

            console.log('Wrong ans code ' +  stdout);

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
            if(err) return callback(err);

            console.log((opts.runDir + '/' + file + ' truncated').green);
            callback();
        });
    }, function(err){
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
    var whyError =  null;

    _.forEach(runs,function(value) {
        cpu = Math.max(cpu, parseFloat(value.cpu));
        memory = Math.max(memory, parseInt(value.memory));
        finalCode = String(value.code);
        if( value.whyError !== 'null' ){
            whyError = value.whyError;
        }
    });

    console.log('Final Result '.green);
    console.log(('Cpu: ' + cpu).green);
    console.log(('memory: ' + memory).green);
    console.log(('finalCode: ' + finalCode).green);

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
        ],
        function(err, results){
            if(err) console.log('error while getFinalResult updating of contest!');
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
                if(err) console.log(('error cleaning runDir ' + runDir).red);
                cb();
            });
        },
        function (cb) {
            rimraf(codeDir, function (err) {
                if(err) console.log(('error cleaning codedir ' + codeDir).red);
                cb();
            });
        }
    ], callback);
};
