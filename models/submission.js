
var _           = require('lodash');
var async       = require('async');
var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');


exports.insert = function(inserts,cb){

    var sql = Query.insert(inserts)
        .into('submissions');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ){ return cb(err); }

            cb(null,rows.insertId);
        });
};


exports.update = function(sid,inserts,cb){

    var sql = Query('submissions').update(inserts).where('id',sid);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};