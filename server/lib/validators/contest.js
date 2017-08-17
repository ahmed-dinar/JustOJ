'use strict';

var moment = require('moment');
var Promise = require('bluebird');

var AppError = appRequire('lib/custom-error');
var ContestModel = appRequire('models/contest');


function ContestValidator(cid){
  this.cid = cid;
}


ContestValidator.prototype.exists = function(){
  var self = this;
  return new Promise(function(resolve, reject){
    ContestModel.find(self.cid, ['id'], function(err, contest){
      if(err){
        return reject(err);
      }
      return resolve(contest.length > 0);
    });
  });
};


ContestValidator.prototype.isEnded = function(){
  var self = this;
  return new Promise(function(resolve, reject){
    ContestModel.find(self.cid, ['end'], function(err, contest){
      if(err){
        return reject(err);
      }
      if( !contest.length ){
        return reject(new AppError('No Contest Found', 'NOT_FOUND'));
      }
      return resolve(moment().isAfter(contest.end));
    });
  });
};


ContestValidator.prototype.isRunning = function(){
  var self = this;
  return new Promise(function(resolve, reject){
    ContestModel.find(self.cid, ['end','begin'], function(err, contest){
      if(err){
        return reject(err);
      }
      if( !contest.length ){
        return reject(new AppError('No Contest Found', 'NOT_FOUND'));
      }
      return resolve(moment().isBetween(contest.begin, contest.end));
    });
  });
};


ContestValidator.prototype.isScheduled = function(){
  var self = this;
  return new Promise(function(resolve, reject){
    ContestModel.find(self.cid, ['begin'], function(err, contest){
      if(err){
        return reject(err);
      }
      if( !contest.length ){
        return reject(new AppError('No Contest Found', 'NOT_FOUND'));
      }
      return resolve(moment().isBefore(contest.begin));
    });
  });
};


ContestValidator.prototype.isIncomplete = function(){
  var self = this;
  return new Promise(function(resolve, reject){
    ContestModel.find(self.cid, ['status'], function(err, contest){
      if(err){
        return reject(err);
      }
      if( !contest.length ){
        return reject(new AppError('No Contest Found', 'NOT_FOUND'));
      }
      return resolve( parseInt(contest.status) === 0 );
    });
  });
};


module.exports = ContestValidator;