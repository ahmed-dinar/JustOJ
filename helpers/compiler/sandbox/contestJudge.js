
var path        = require('path');
var fs          = require('fs');
var exec        = require('child_process').exec;

var async       = require('async');
var _           = require('lodash');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var mkdirp      = require('mkdirp');

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


    Contest.UpdateSubmission(opts.sID, { status: '6' }, function(err){
        if(err){
            console.log('What the hell updating run status!'.red);
            console.log(err);
        }
    });


    opts['runName'] = opts.sID;
    opts['runDir']  = MyUtil.RUN_DIR + '/' + opts.runName;
    opts['tcDir']   = MyUtil.TC_DIR + '/' + opts.pID;


    console.log(opts);
    console.log('runDir: ' + opts.runDir);
    console.log('tcDir: ' + opts.tcDir);

    async.waterfall([
        function(callback) {
            makeTempDir(opts.runDir,callback);
        },
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

            async.mapSeries(testCases, runTestCase.bind(null,opts), function(err, results){
                callback(err,results);
            });
        }
    ], function (error, runs) {

        cleanSubmit(opts.runDir);

        if( error ){

            if( _.isUndefined(runs) ){

                Contest.UpdateSubmission(opts.sID, { status: '8' }, function(err){
                    if(err){
                        console.log('What the hell updating run status!'.red);
                        console.log(err);
                    }
                    return cb(error);
                });
            }
            else if( runs.compiler ){

                async.parallel([
                        function(callback){
                            Contest.UpdateRank(opts.cID,opts.uID,opts.pID,7,function(err,rows){
                                if(err){ return callback(err); }

                                console.log('rank updated!');
                                callback();
                            });
                        },
                        function(callback){
                            Contest.UpdateSubmission(opts.sID, { status: '7' }, function(err){
                                if(err){
                                    console.log('What the hell updating run status!'.red);
                                    console.log(err);
                                    return callback(err);
                                }
                                callback();
                            });
                        }
                    ],
                    function(err, results){

                        cb(null,runs);
                    });

                return;
            }
            else if( _.isUndefined(runs[0]) ){

                Contest.UpdateSubmission(opts.sID, { status: '8' }, function(err){
                    if(err){
                        console.log('What the hell updating run status!'.red);
                        console.log(err);
                    }
                    return cb(error);
                });
            }
            else{
                console.log('Error but runs exists');
                console.log(runs);
                getFinalResult(runs,opts,cb);
            }
            return;
        }

        getFinalResult(runs,opts,cb);
    });

};

var getFinalResult = function(runs,opts,cb){


    var finalCode = 8;
    var cpu = 0.0;
    var memory = 0.0;

    _.forEach(runs,function(value) {
        cpu = Math.max(cpu, parseInt(value.cpu));
        memory = Math.max(memory, parseInt(value.memory));
        finalCode = value.code;
    });


    console.log('Final Result '.green);
    console.log(('Cpu: ' + cpu).green);
    console.log(('memory: ' + memory).green);
    console.log(('finalCode: ' + finalCode).green);


    async.parallel([
            function(callback){

                Contest.UpdateSubmission(opts.sID, {
                    status: String(finalCode),
                    cpu: String(cpu),
                    memory: String(memory)
                }, function(err){
                    if(err){
                        console.log('What the hell updating run status!');
                        console.log(err);
                    }

                    callback();
                });
            },
            function(callback){
                Contest.UpdateRank(opts.cID,opts.uID,opts.pID,finalCode,function(err,rows){
                    if(err){ return callback(err); }

                    console.log('rank updated!');
                    callback();
                });
            }
        ],
        function(err, results){

            cb(null,runs);
        });

};

var compileCode = function (opts,cb) {

    Compiler.compile(opts, function (err,stderr, stdout) {

        if(err) {
            return cb(err,{compiler: 'Compiler Error'});
        }

        if(stderr) {
            return cb(stderr,{ compiler: 'Compiler Error'});
        }

        console.log(('Compiled Successfully').green);
        cb();
    });
};

var getTestCases = function (tcDir,cb) {

    fs.readdir(tcDir, function(err, files) {

        if( err ){
            console.log('getTestCases error:: '.red);
            console.log(err);
            return cb(err);
        }


        if( files.length === 0 ){
            console.log(('No Test Case Found in ' + tcDir).red);
            return cb('No Test Case Found');
        }

        console.log(files);

        cb(null,files);
    });
};


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

            if( resultObj.result !== 'OK' ){
                return callback(null,resultObj);
            }

            compareResult(opts,testCase,resultObj,callback);
        }
    ], function (error, result) {

        clearRun(opts,error, result,cb);

    });
};


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
        if( err ){
            return cb(err);
        }
        cb(null,testCases);
    });

};

var runCode = function (opts,testCase,cb) {

    Compiler.run(opts, testCase, function (err,stdout, stderr) {

        if(err) {
            return cb(err);
        }

        if(stderr) {
            return cb(stderr);
        }

        cb();
    });

};



var checkResult = function (opts,cb) {

    var resDir = opts.runDir +'/result.txt';

    console.log(('Checking ' + resDir + ' for run result').yellow);

    fs.readFile(resDir, 'utf8', function (error,data) {

        if (error ) {
            console.log('Error reading result file'.red);
            return cb(error);
        }

        if( data.length === 0 ) {
            console.log('Why result file empty?'.red);
            return cb('no result in file');
        }


        var resultObj = _.zipObject(['code', 'msg','cpu','memory'], _.split(data,'$',4));


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


        if( resultObj.code !== '0' ){
            return cb(resultObj.result, resultObj);
        }

        cb(null,resultObj);
    });

};


var compareResult = function (opts,testCase,resultObj,cb) {

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


var clearRun = function(opts,error, result,cb){

    var files = ['output.txt','error.txt','result.txt'];
    async.each(files, function(file, callback) {

        fs.truncate(opts.runDir + '/' + file, 0, function(err){
            if(err){
                return callback(err);
            }
            console.log((opts.runDir + '/' + file + ' truncated').green);
            callback();
        });

    }, function(err){

        if( err ){
            console.log('clearRun Error'.red);
        }

        cb(error,result);

    });

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


//clean up submitted code and run files
function cleanSubmit(codeDir){
    rimraf(codeDir, function (err) {
        if( err ){
            console.log(err);
            return;
        }

        console.log('success clean submit!'.green);
    });
}