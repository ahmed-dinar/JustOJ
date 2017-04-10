
var async      = require('async');
var dbPool     = require('./pool');


var colors      = require('colors');

exports.execute = function(sql,cb){

    console.log('[SQL-QUERY]: '.red + sql.cyan);

    async.waterfall([
        function(callback) {

            dbPool.getConnection(function(err, connection) {
                if(err){
                    console.log('Error establishing connection with database'.red);
                    return callback(err);
                }
                callback(null,connection);
            });
        },
        function(connection,callback) {

            connection.query(sql, function(err, rows) {

                connection.release();

                if(err){
                    console.log('Error querying database'.red);
                    return callback(err);
                }

                return callback(null,rows);
            });
        }
    ], function (err, rows) {

        if(err){
            console.log('[SQL-STAT]: Failed'.red);
            console.error(err);
            return cb(err);
        }

        cb(null,rows);
    });
};