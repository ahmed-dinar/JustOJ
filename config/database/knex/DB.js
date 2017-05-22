'use strict';

/**
 * Module dependencies.
 */
var async = require('async');
var dbPool = require('./pool');
var logger = require('winston');


/**
 *
 * @param sql
 * @param cb
 */
exports.execute = function(sql,cb){

    logger.debug('[SQL-QUERY]: ' + sql);

    async.waterfall([
        function(callback) {

            dbPool.getConnection(function(err, connection) {
                if(err){
                    logger.error('Error establishing connection with database');
                    return callback(err);
                }
                return callback(null,connection);
            });
        },
        function(connection,callback) {

            connection.query(sql, function(err, rows) {

                connection.release();

                if(err){
                    logger.error('Error querying database'.red);
                    return callback(err);
                }

                return callback(null,rows);
            });
        }
    ], function (err, rows) {

        if(err){
            logger.error('[SQL-STAT]: Failed', err);
            return cb(err);
        }

        return cb(null,rows);
    });
};