
var path        = require('path');
var fs          = require('fs');

var async       = require('async');
var _           = require('lodash');
var jsdiff      = require('diff');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var mkdirp      = require('mkdirp');

var Compiler    = require('./compiler');


/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

    async.waterfall([
        function(callback){
            compileCode(opts,callback);
        },
        function(callback) {
            getTestCases(opts.pid,callback);
        },
        function(testCases,callback){

            async.mapSeries(testCases, runTestCase.bind(null, opts), function (err, res) {
                callback(err,res);
            });

        }
    ], function (error, runs) {


        if( error ){
            if( runs ){

                console.log('Why Compiler Error');
                console.log(error);
                console.log('And Runs::');
                console.log(runs);

                cb(null,{ compiler: 'Compiler Error' });
            }else{
                cb(error);
            }
            return;
        }

        getFinalResult(runs,opts.language,cb);

    });

};

var getFinalResult = function(runs,language,cb){


    var finalResult = 'Accepted';
    var cpu = 0;
    var memory = 0;
    var runResult = {};
    var runTest = [];


    _.forEach(runs,function(value) {

        cpu = Math.max(cpu, parseInt(value.cpu));
        memory = Math.max(memory, parseInt(value.memory));

        if( value.result !=='Accepted' && finalResult === 'Accepted' ){
            finalResult = value.result;
        }

        var temp = {
            cpu: value.cpu,
            memory: value.memory,
            result: value.result,
            language: language
        };
        runTest.push(temp);

    });

    runResult['runs'] = runTest;
    runResult['language'] = language;
    runResult['final'] = {
        cpu: cpu,
        memory: memory,
        result: finalResult,
        language: language
    };

    cb(null,runResult);
};

var compileCode = function (opts,cb) {

    Compiler.compile(opts, function (err,stderr, stdout) {

        if(err) {
            return cb(err,'Compiler Error');
        }

        if(stderr) {
            return cb(stderr,'Compiler Error');
        }

        cb();
    });
};

var getTestCases = function (pid,cb) {

    var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + pid);
    fs.readdir(rootDir, function(err, files) {

        if( err ){
            console.log('getTestCases error:: ');
            console.log(err);
            return cb(err);
        }

        var testCases = [];
        _.forEach(files, function(file) {
            testCases.push(rootDir + '/' + file);
        });

        if( testCases.length ){
            return cb(null,testCases);
        }

        cb('No Test Case Found');
    });

};


var runTestCase = function(options,testCase,cb){



    var uniquename =  uuid.v4();
    var saveTo = path.normalize(options.codeDir + '/' + uniquename);

    console.log('run in : ' + options.codeDir);
    console.log('and 0unTestCase in : ' + saveTo);

    var opts = options;
    opts['fileDir'] = uniquename;

    async.waterfall([
        function(callback) {
            makeTempDir(saveTo,callback);
        },
        function(callback) {
            createAdditionalFiles(saveTo,callback);
        },
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

        if( error ){
            return cb(error);
        }

        cb(null,result);

    });
};


var makeTempDir = function(saveTo,cb){
    mkdirp(saveTo, function (err) {
        if (err) {
            console.log('OMG ' + saveTo + ' creation failed! permission denied!!');
            return cb(err);
        }
        cb();
    });
};

var createAdditionalFiles = function(saveTo,cb){

    var files = ['output.txt','error.txt','result.txt'];
    async.eachSeries(files, function(file, callback) {

        fs.open(saveTo + '/' + file ,'w',function(err, fd){
            if( err ){
                return callback(err);
            }

            callback();
        });

    }, function(err){
        if( err ){
            return cb(err);
        }
        cb();
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

    var resDir = opts.codeDir + '/' + opts.fileDir +'/result.txt';

    fs.readFile(resDir, 'utf8', function (error,data) {

        if (error ) { return cb(error); }

        if( data.length === 0 ) { return cb('no result in file'); }


        var resultObj = _.zipObject(['code', 'msg','cpu','memory'], _.split(data,'$',4));

        console.log(resultObj);

        switch(resultObj.code) {
            case '-1':
                return cb('System Error');
                break;
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
            default:
                return cb('System Error??');
        }

        cb(null,resultObj);

    });

};


var compareResult = function (opts,testCase,resultObj,cb) {


    async.waterfall([
        function(callback) {

            fs.readFile(testCase+'/o.txt', 'utf8', function (error,judgeData) {

                if (error) { return callback(error); }

                callback(null,judgeData);
            });

        },
        function(judgeData,callback){

            var resDir = opts.codeDir + '/' + opts.fileDir +'/output.txt';
            fs.readFile(resDir, 'utf8', function (error,userData) {

                if (error) { return callback(error); }

                var diff = jsdiff.diffChars(judgeData, userData);

                if( diff.length !== 1 ){
                    resultObj['result'] = 'Wrong Answer';
                }else {
                    resultObj['result'] = 'Accepted';
                }

                callback(null,resultObj);

            });

        }
    ], function (error, result) {

        if( error ){ return cb(error); }

        cb(null,result);

    });


};





