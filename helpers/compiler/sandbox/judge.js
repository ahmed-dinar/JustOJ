
var path        = require('path');
var fs          = require('fs');

var async       = require('async');
var _           = require('lodash');
var jsdiff      = require('diff');

var Compiler    = require('./compiler');


/**
 *
 * @param opts
 * @param cb
 */
exports.run = function(opts,cb){

    console.log(opts);

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
    ], function (error, result) {



        cb(error,result);
    });

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


var runTestCase = function(opts,testCase,cb){

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

        if( error ){
            return cb(error);
        }

        cb(null,result);

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

    fs.readFile(opts.codeDir +'/result.txt', 'utf8', function (error,data) {

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

            fs.readFile(opts.codeDir +'/output.txt', 'utf8', function (error,userData) {

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





