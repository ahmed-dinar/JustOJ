'use strict';

//is it BAD PRACTICE??  :|

/**
 *
 * @param req
 * @param res
 * @param next
 */

exports.step1Get = function(req,res,next){
  require('./step1')(req,res,next).get();
};

exports.step1Post = function(req,res,next){
  require('./step1')(req,res,next).post();
};

exports.step2Get = function(req,res,next){
  require('./step2')(req,res,next).get();
};

exports.step2Post = function(req,res,next){
  require('./step2')(req,res,next).post();
};

exports.step3Get = function(req,res,next){
  require('./step3')(req,res,next).get();
};

exports.step3Post = function(req,res,next){
  require('./step3')(req,res,next).post();
};

exports.testJudgeSolution = function(req,res,next){
  require('./testJudgeSolution')(req,res,next);
};

exports.removeTestCase = function(req,res,next){
  require('./removeTestCase')(req,res,next);
};

