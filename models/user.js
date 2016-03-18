var Query           = require('../config/database/query');
var async           = require('async');
var bcrypt          = require('bcryptjs');

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

            Query.in('users').findAll({
                where: {
                    username: username
                }
            }, function (err, rows) {

                if (err) {
                   return callback(err,null);
                }

                if (rows.length > 0) {
                    return callback(null, rows[0]);
                }

                return callback('invalid username or password', null);

            });

        },

        //comapare password with hash
        function (rows, callback) {

            bcrypt.compare(password, rows.password, function(err, res) {

                if(err) { return callback('Error compare password'); }

                if(res){ return callback(null,rows);  }

                return callback('invalid username or password', null);

            });

        }


    ], function (err, result) {

        if( err ){ return fn(err,null); }

        return fn(null,result);

    });

};


User.solvedList = function(id,callback){

    Query.in('user_solved_list').findAll({
        where:{
            uid: id
        }
    },function(err,rows){
        callback(err,rows);
    });

};



module.exports = User;











