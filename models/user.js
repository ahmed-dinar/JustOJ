
var async           = require('async');
var bcrypt          = require('bcryptjs');

var DB              = require('../config/database/knex/DB');
var Query           = require('../config/database/knex/query');

function User(){}

/**
 *
 * @param username
 * @param password
 * @param fn
 */
User.login = function(username, password, fn) {

    
    async.waterfall([

        //find user by username
        function (callback) {

            var sql = Query.select()
                .from('users')
                .where({
                    'username': username
                })
                .limit(1);

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if (err) { return callback(err,null); }

                    if (rows.length) { return callback(null, rows[0]); }

                    callback('invalid username or password');
                });
        },
        //comapare password with hash
        function (rows, callback) {

            bcrypt.compare(password, rows.password, function(err, res) {

                if(err) { return callback('Error compare password'); }

                if(res){ return callback(null,rows);  }

                callback('invalid username or password');

            });

        }

    ], function (err, result) {

        if( err ){ return fn(err); }

        return fn(null,result);
    });
};


User.available = function(username,email,fn){

    if( username && email ){
        var sql = Query.select('username')
            .from('users')
            .where('username', username)
            .orWhere('email',email)
            .limit(1);
        DB.execute(sql.toString(),fn);
    }
    else if( username ){
        var sql = Query.select('username').from('users').where('username',username).limit(1);
        DB.execute(sql.toString(),fn);
    }else if( email ){
        var sql = Query.select('email').from('users').where('email', email).limit(1);
        DB.execute(sql.toString(),fn);
    }else{
        fn('empty fields');
    }
};

User.problemStatus = function(id,callback){

    var sql = Query.select()
        .from('user_problem_status')
        .where({
            'uid': id
        });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            callback(err,rows);
        });
};



module.exports = User;











