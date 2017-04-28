
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var async = require('async');
var _ = require('lodash');
var jsdiff = require('diff');
var uuid = require('node-uuid');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

var MyUtil = require('../myutil');
var Submission = require('../../models/submission');
var Problems = require('../../models/problems');
var Compiler = require('../compiler/sandbox/compiler');

var colors = require('colors');


/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

   // opts['runDir']  = MyUtil.RUN_DIR + '/' + opts.runName;

    console.log(opts);
    console.log('runDir: ' + opts.runDir);
    console.log('tcDir: ' + opts.tcDir);

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
            console.log(('Total Test Cases: ' + testCases.length).green);
            async.mapSeries(testCases, runTestCase.bind(null,opts), callback);
        }
    ], function (error, runs) {

        rimraf(opts.runDir, function (err) {
            if( err ) console.log(err);

            console.log('success clean submit!'.green);

            if( error ){
                if( runs.compiler )
                    return cb(error,runs);

                if( !runs || _.isUndefined(runs[0]) )
                    return cb(error,{});

                console.log('Error but runs exists');
                console.log(runs);
            }

            getFinalResult(runs,opts,cb);
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

        if(err) return cb(err,{compiler: 'Compiler Error'});

        if(stderr) return cb(stderr,{ compiler: 'Compiler Error'});

        console.log(('Compiled Successfully').green);
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
        if( err ){
            console.log('getTestCases error:: '.red);
            console.log(err);
            return cb(err,{});
        }
        if( files.length === 0 ){
            console.log(('No Test Case Found in ' + tcDir).red);
            return cb('No Test Case Found',{});
        }
        console.log(files);
        cb(null,files);
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
 * Run program under a specific test case
 * @param opts
 * @param testCase
 * @param cb
 */
var runTestCase = function(opts,testCase,cb){
    testCase = opts.tcDir + '/' + testCase;
    async.waterfall([
        function(callback) {
            runCode(opts,testCase,callback);
        },
        function(callback){
            checkResult(opts,callback);
        },
        function(resultObj,callback){
            if( resultObj.result !== 'OK' ) return callback(null,resultObj);

            compareResult(opts,testCase,resultObj,callback);
        }
    ], function (error, result) {
        clearRun(opts,error, result,cb);
    });
};


/**
 * Run program under chroot sandbox
 * @param opts
 * @param testCase
 * @param cb
 */
var runCode = function (opts,testCase,cb) {
    Compiler.run(opts, testCase, function (err,stdout, stderr) {
        if(err) return cb(err);

        if(stderr) {
            console.log('stderr occured!');
            console.log(stderr);
            return checkResult(opts,cb);
        }
        cb();
    });
};


/**
 * Check result file in chroot directory
 * @param opts
 * @param cb
 */
var checkResult = function (opts,cb) {

    var resDir = opts.runDir +'/result.txt';
    console.log(('Checking ' + resDir + ' for run result').yellow);

    fs.readFile(resDir, 'utf8', function (error,data) {
        if (error ) return cb(error);

        if( data.length === 0 ) {
            console.log('Why result file empty?'.red);
            return cb('no result in file');
        }

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
        console.log(resultObj);

        if( resultObj.code !== '0' ) return cb(resultObj.result, resultObj);  //not accepted

        cb(null,resultObj);
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
//ads
    var judgeOutput = testCase + '/o.txt';
    var userOutput = opts.runDir +'/output.txt';
    var command = './helpers/compiler/sandbox/compare ' + judgeOutput + ' ' + userOutput;

    exec(command, {
        env: process.env,
        timeout: 9000,
        maxBuffer: 1000*1024
    }, function(err, stdout, stderr) {

        if (err) {

            if( err.code === 2 || err.code === 3 ){

                console.log('Wrong ans code ' + err.code);
                console.log(stdout.red);

                resultObj.code = '9';
                resultObj['result'] = 'Wrong Answer';
                return cb(resultObj.result,resultObj);
            }

            console.log('Compare Error'.red);
            console.log(err);

            return cb(err);
        }

        console.log('Compare OK'.green);

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
var clearRun = function(opts,error, result,cb){
    var files = ['output.txt','error.txt','result.txt'];
    async.each(files, function(file, callback) {
        fs.truncate(opts.runDir + '/' + file, 0, function(err){
            if(err) return callback(err);

            console.log((opts.runDir + '/' + file + ' truncated').green);
            callback();
        });
    }, function(err){
        if( err ) console.log('clearRun Error'.red);

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
        cpu: cpu,
        memory: memory,
        result: result,
        language: opts['language'],
        whyError: whyError
    };

    console.log('Final Result '.green);
    console.log(('Cpu: ' + cpu).green);
    console.log(('memory: ' + memory).green);
    console.log(('Code: ' + finalCode).green);
    console.log(('result: ' + result).green);

    cb(null,fres);
};


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


