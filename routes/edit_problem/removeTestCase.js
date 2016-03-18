var path        = require("path");
var fse         = require('fs-extra');
var async       = require('async');
var _           = require('lodash');
var Problems    = require('../../models/problems');
var rimraf      = require('rimraf');


module.exports = function(req, res, next) {

    if( !req.body.pid || !req.body.casename ){
        return next(new Error('No Request body found'));
    }

    async.waterfall([
        function(callback) {
            findTestCase(req.body.pid,req.body.casename,callback);
        },
        function(testCase,callback){
            removeTestCase(testCase,req.body.pid,req.body.casename,callback);
        }
    ], function (error, row) {

        if( error ) {
            req.flash('tcRemErr',error);
        }else{
            req.flash('tcRemSuccess', 'Test Case Removed');
        }

        res.redirect('/ep/' + req.body.pid + '/2');

    });

};


var findTestCase = function(pid,casename,callback){

    Problems.findTC('test_cases',{
        where:{
            $and:{
                pid: pid,
                name: casename
            }
        }
    },function(err,row){
        if( err ) { return callback(new Error(err)); }

        if( row.length == 0 ) { return callback(new Error('No such Test Case Found')); }

        callback(null,row[0]);
    });
};

var removeTestCase = function(testCase,pid,casename,callback){

    Problems.removeTC('test_cases',{
        where:{
            $and: {
                pid: pid,
                name: casename
            }
        }
    },function(err,row){

        if( err ) { return callback(new Error('Problem Removing TC DB')) ; }

        var TCDir =  path.normalize(process.cwd() + '/files/tc/p/' + pid +  '/' + testCase.name);

        rimraf(TCDir, function (err) {
            if( err ){ console.log(err); }
            callback(null);
        });

    });
};
