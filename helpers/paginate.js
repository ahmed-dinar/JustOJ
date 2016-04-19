/**
 *
 * @param table
 * @returns {exports}
 */


var Pagination  = require('../helpers/pagination').Pagination;
var async       = require('async');

var DB          = require('../config/database/knex/DB');


exports.paginate = function(opts,cb) {
    async.waterfall([
        function(callback) {
            count(opts.sqlCount,callback);
        },
        function(total_count,callback){
            find(opts,total_count,callback);
        }
    ], function (error, rows, pagination) {
        cb(error,rows,pagination);
    });
};



var count = function(sqlCount,callback){

    DB.execute(
        sqlCount.toString()
        ,function(err,rows){
            if(err){ return callback(err); }

            callback(null,rows[0].count);
        });
};


var find = function(opts, total_count, callback){

    var pagination = new Pagination(opts.cur_page,opts.limit,total_count);

    var sql = opts.sql
        .limit(pagination.page_limit)
        .offset(pagination.offset());

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if(err){ return callback(err); }

            callback(null,rows,pagination);
        });
};


