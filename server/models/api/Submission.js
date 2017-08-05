'use strict';


// var _ = require('lodash');
// var async = require('async');
// var has = require('has');

var DB = appRequire('config/database/knex/DB');
var Query = appRequire('config/database/knex/query');
//var Paginate = require('../lib/pagination/paginate');


//
// save a new submission
//
exports.save = function(inserts, fn){
  var sql = Query
    .insert(inserts)
    .into('submissions')
    .toString();

  DB.execute(sql,function(err,rows){
    if(err){
      return fn(err);
    }

    return fn(null, rows.insertId);
  });
};


//
// save source code of subbmission
//
exports.saveSource = function(inserts, fn){
  var sql = Query
    .insert(inserts)
    .into('submission_code')
    .toString();

  DB.execute(sql,fn);
};


//
// update a submission
//
exports.put = function(id, cols, fn){
  var sql = Query('submissions')
    .update(cols)
    .where('id', id)
    .toString();

  DB.execute(sql, fn);
};



//
//
//
exports.byUser = function(uid, cb){

};

