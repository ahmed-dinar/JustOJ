'use strict';

/**
 * Module dependencies.
 */
var Problems = require('../../models/problems');
var MyUtil = require('../../lib/myutil');
var fs = require('fs');
var path = require('path');
var async = require('async');
var logger = require('winston');


module.exports = function(req,res,next){

  var module = {};

  module.get = function(){

    async.waterfall([
      function(callback) {
        Problems.findById(req.params.pid,['id'],function(err,row){
          if( err )
            return callback(err);

          if( !row.length )
            return callback('404, No problem found');

          callback();
        });
      },
      function(callback){
        var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid);
        fs.readdir(rootDir, function(err, files) {

          if( err ){
            if( err.code === 'ENOENT' )
              return callback(null,'Please add some test case first');   //no test cases added yet!

            return callback(err);
          }

          if(!files || !files.length)
            return callback(null,'Please add some test case first');

          callback();
        });
      }
    ], function (error, noTest) {

      if (error) {
        logger.error(error);
        return next(error);
      }

      if (noTest){
        req.flash('noTestCase', 'Please add some test case.');
        return res.redirect('/problems/edit/' + req.params.pid + '/2');
      }

      res.render('problem/edit/step_3', {
        active_nav: 'problems',
        title: 'editproblem | JUST Online Judge',
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        pid: req.params.pid,
        error: req.flash('error')
      });
    });
  };

  module.post = function(){

    var cpu = req.body.ftl;
    var memory = req.body.fml;

    if( !cpu || !memory || !MyUtil.isNumeric(cpu) || !MyUtil.isNumeric(memory) ){
      req.flash('error', 'invalid or empty limits, please check again');
      res.redirect('/problems/edit/' + req.params.pid + '/3');
      return;
    }

    if( parseFloat(cpu) < 0.0 || parseFloat(cpu)>5.0 ){
      req.flash('error', 'cpu limit should not be less than zero or greater than 5s');
      res.redirect('/problems/edit/' + req.params.pid + '/3');
      return;
    }

    if( parseInt(memory) < 0.0 || parseInt(memory)>256 ){
      req.flash('error', 'memory limit should not be less than zero or greater than 256mb');
      res.redirect('/problems/edit/' + req.params.pid + '/3');
      return;
    }

    async.waterfall([
      function(callback) {
        Problems.findById(req.params.pid,['id'],function(err,row){
          if( err )
            return next(new Error(err));

          if( row.length == 0 )
            return next(new Error('404 no problem found'));

          callback();
        });
      },
      function(callback){
        var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid);
        fs.readdir(rootDir, function(err, files) {
          if( err ){
            if( err.code === 'ENOENT' )
              return callback('noTest','Please add test case first');   //no test cases added yet!

            return callback(err);
          }

          if(!files || files.length === 0)
            return callback('noTest','Please add test case first');

          callback();
        });
      },
      function(callback) {

        var limits = {
          cpu: parseInt(parseFloat(cpu)*1000.0),
          memory: memory,
          status: 'public'
        };

        Problems.updateLimits(req.params.pid,limits,function(err,row){

          if(err)
            return callback(err);

          callback();
        });
      }
    ], function (error, noTest) {

      if( error && !noTest ) {
        logger.error(error);
        return next(new Error(error));
      }

      if (noTest){
        req.flash('noTestCase', 'Please add some test case');
        res.redirect('/problems/edit/' + req.params.pid + '/2');
        return;
      }

      res.redirect('/problems');
    });
  };

  return module;
};
