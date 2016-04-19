var _           = require('lodash');
var async       = require('async');

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');



exports.create = function(inserts,cb){

    var sql = Query.insert(inserts).into('contest');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.update = function(inserts,cid,cb){

    var sql = Query('contest').update(inserts)
        .where({ 'id': cid });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.updateProblem = function(inserts,pid,cb){

    var sql = Query('problems').update(inserts)
        .where({
            'id': pid
        });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};



exports.getDetails = function(cid,cb){

    var sql = Query.select().from('contest').where('id', cid).limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.getProblems = function(cid,cb){

    var sql = Query.select(['contest_problems.pid','problems.title','problems.status'])
        .from('contest_problems')
        .leftJoin('problems', 'contest_problems.pid', 'problems.id')
        .where('contest_problems.cid', cid)
        .as('ignored_alias');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.insertProblem = function(cid,pid,cb){

    var sql = Query.insert({
        'cid': cid,
        'pid': pid
    })
        .into('contest_problems');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};









