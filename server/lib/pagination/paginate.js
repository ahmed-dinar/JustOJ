'use strict';

/**
 *
 * @param table
 * @returns {exports}
 */

var async = require('async');
var Pagination = require('./pagination').Pagination;
var DB = require('../../config/database/knex/DB');


/**
 *
 * @param opts
 * @param cb
 */
exports.paginate = function(opts, cb) {
  async.waterfall([
    async.apply(count, opts),
    find
  ], cb);
};


/**
 *
 * @param opts
 * @param callback
 */
var count = function(opts,callback){

  DB.execute(
        opts.sqlCount.toString()
        ,function(err,rows){
          if(err)
            return callback(err);

          opts['total_count'] = rows[0].count;
          return callback(null, opts);
        });
};


/**
 *
 * @param opts
 * @param callback
 */
var find = function(opts, callback){

  var pagination = new Pagination(opts['cur_page'], opts['limit'], opts['total_count'], opts['url']);

  var sql = opts.sql
        .limit(pagination.page_limit)
        .offset(pagination.offset());

  DB.execute(
        sql.toString()
        ,function(err,rows){
          if(err)
            return callback(err);

          return callback(null, rows, pagination);
        });
};


