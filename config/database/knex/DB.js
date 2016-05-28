var dbPool     = require('./pool');

var colors      = require('colors');

exports.execute = function(sql,callback){

    console.log('[SQL-QUERY]: '.red + sql.blue);

    dbPool.getConnection(function(err, connection) {

        if(err){
            console.log('[SQL-STAT]: Failed. '.red + 'Error establishing connection with database');
            console.log(err);
            return callback('Error establishing connection with database!');
        }

        connection.query(sql, function(err, rows) {

            connection.release();

            if(err){
                console.log('[SQL-STAT]: Failed'.red);
                console.log(err);
                return callback('database error!',null);
            }

            console.log('[SQL-STAT]: '.red + 'Success!'.green);

            return callback(null,rows);

        });
    });
};