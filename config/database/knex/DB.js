var dbPool     = require('./pool');

exports.execute = function(sql,callback){

    console.log(sql);

    dbPool.getConnection(function(err, connection) {

        if(err){
            console.log('err establishing connection with database::');
            console.log(err);
            return callback('error establishing connection with database!',null);
        }

        connection.query(sql, function(err, rows) {

            connection.release();

            if(err){
                console.log('database error!::');
                console.log(err);
                return callback('database error!',null);
            }

            return callback(null,rows);

        });
    });
};