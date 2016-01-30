var Compiler    = require('./compiler');
var Problems    = require('../../models/problems');
var _           = require('lodash');
var path        = require('path');
var jsdiff      = require('diff');
var fs          = require('fs');
var async       = require('async');

/**
 * Initialize judge data
 * @param config
 */
exports.init = function init(config){
    this.language = config.language;
    this.timeLimit = config.timeLimit;
    this.memoryLimit = config.memoryLimit;
    this.runPath = config.runPath;
    this.runName = config.runName;
};


/**
 * Run the judge main function
 * @param problemId
 * @param fn
 */
exports.run = function (problemId,fn) {

    var runPath = this.runPath;
    var runName = this.runName;

    var compiler = new Compiler('windows',{
        language: this.language,
        timeLimit:  parseFloat(this.timeLimit)*1000.0,
        memoryLimit: parseInt(this.memoryLimit)*1024
    });

    async.waterfall([
        function(callback) {
            compileCode(runPath,runName,compiler,callback);
        },
        function(callback){
            findTestCases(problemId,callback);
        },
        function(testCases,callback){
            judgeTestCases(testCases,problemId,runPath,runName,compiler,callback);
        }
    ], function (error, success) {
        if (error) { return fn(error); }
        else{
            fn(success);
        }
    });

};

/**
 *
 * @param runPath
 * @param runName
 * @param compiler
 * @param callback
 */
var compileCode = function(runPath,runName,compiler,callback){
    compiler.compile(runPath,runName,function(stdErr,stdOut){
        if( stdErr ){
            console.log('Compiler errors: ');
            console.log(stdErr);
            return callback(new Error('Compiler Error'));
        }
        callback(null);
    });
};


/**
 *
 * @param problemId
 * @param callback
 */
var findTestCases = function(problemId,callback){
    Problems.findTC('test_cases',{
        attributes: ['name'],
        where:{
            pid: problemId
        }
    },function(err,testCases){

        if( err ) { return  callback(err); }

        if( testCases.length === 0 ) { return  callback('No Test Case Found!'); }

        callback(null,testCases);

    });
};

/**
 *
 * @param testCases
 * @param problemId
 * @param runPath
 * @param runName
 * @param compiler
 * @param callback
 */
var judgeTestCases = function(testCases,problemId,runPath,runName,compiler,callback){

    async.eachSeries(testCases, function(testCase, eachCallback) {

        var testCasePath = path.normalize(process.cwd() + '/files/tc/p/' + problemId + '/' + testCase.name);

        async.waterfall([
            function(runCallback) {
                runTestCase(runPath,runName,testCasePath,compiler,runCallback);
            },
            function(stdRunOut,runCallback){
                compareTestCase(stdRunOut,testCasePath,runCallback);
            }
        ], function (error, success) {
            if (error) {
                eachCallback(error);
            }
            else {
                console.log(success);
                eachCallback();
            }
        });

    }, function(err){
        if( err ) {
            callback(err);
        } else {
            callback('ACCEPTED!');
        }
    });
};


/**
 *
 * @param runPath
 * @param runName
 * @param testCasePath
 * @param compiler
 * @param runCallback
 */
var runTestCase = function(runPath,runName,testCasePath,compiler,runCallback){
    compiler.run(runPath,runName,testCasePath+'\\i.txt',function(stdRunErr,stdRunOut){

        if( stdRunErr ){  return  runCallback(stdRunErr); }

        runCallback(null,stdRunOut);
    });
};


/**
 *
 * @param stdRunOut
 * @param testCasePath
 * @param runCallback
 */
var compareTestCase = function(stdRunOut,testCasePath,runCallback){

    fs.readFile(testCasePath+'\\o.txt', 'utf8', function (error,data) {

        if (error) { return runCallback(error); }

        var diff = jsdiff.diffChars(stdRunOut, data);

        if( diff.length !== 1 ){
            console.log('Wrong Answer');
            return runCallback('Wrong Answer');
        }

        runCallback(null,'ACCEPTED');
    });
};
