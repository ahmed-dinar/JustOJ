'use strict';

/**
 * Module dependencies.
 */
var async = require('async');
var bcrypt = require('bcryptjs');
var moment = require('moment');

var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');
var CustomError = require('../lib/custom-error');

function User(){}


/**
 * Login process
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

                if(err) return callback('Error compare password');

                if(res) return callback(null,rows);

                callback('invalid username or password');
            });
        }
    ], fn);
};


/**
 * Check if a username or user email is avaiable
 * it can be use as user exists functionality
 * @param username
 * @param email
 * @param fn
 * @returns {*}
 */
User.available = function(username,email,fn){

    var sql;
    if( username && email ){
        sql = Query.select('username')
            .from('users')
            .where('username', username)
            .orWhere('email',email)
            .limit(1);
    }
    else if( username )
        sql = Query.select('username').from('users').where('username',username).limit(1);
    else if( email )
        sql = Query.select('email').from('users').where('email', email).limit(1);
    else
        return fn('empty fields');

    DB.execute(sql.toString(),fn);
};


/**
 * Insert a password reset token
 * @param email
 * @param token
 * @param callback
 */
User.setResetToken = function (email,token, callback) {

    var expire = moment().add(24, 'hours').format("YYYY-MM-DD HH:mm:ss");

    var sql = Query('users')
        .update({
            reset_token: token,
            token_expires: expire
        })
        .where('email', email);

    DB.execute(sql.toString(), callback);
};



/**
 * Get password reset token
 * @param token
 * @param callback
 */
User.getResetToken = function (token, callback) {

    var sql = Query.select(['token_expires','id'])
        .from('users')
        .where('reset_token', token)
        .limit(1);

    DB.execute(sql.toString(), callback);
};



/**
 * Reset user password from reset token sent to email
 * @param uid
 * @param password
 * @param fn
 */
User.resetPassword = function (uid, password, fn) {

    async.waterfall([
        function(callback) {
            bcrypt.genSalt(10, function (err, salt) {
                if (err)
                    return callback(new CustomError(err,'genSalt'));

                callback(null, salt);
            });
        },
        function(salt,callback) {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err)
                    return callback(new CustomError(err,'hash'));

                callback(null, hash);
            });
        },
        function (hash, callback) {

            var sql = Query('users')
                .update({
                    password: hash,
                    reset_token: ''
                })
                .where('id', uid);

            DB.execute(sql.toString(), callback);
        }
    ], fn);
};


/**
 * Get problem status
 * @param id
 * @param callback
 */
User.problemStatus = function(id,callback){

    var sql = Query.select()
        .from('user_problem_status')
        .where({
            'uid': id
        });

    DB.execute(sql.toString(), callback);
};


/**
 * Update user info
 * @param credentials
 * @param callback
 */
User.updateProfile = function(credentials,callback){

    var sql = Query('users')
        .update(credentials.fields)
        .where('id', credentials.id);

    DB.execute(sql.toString(), callback);
};



/**
 * Change password from user profile settings
 * @param credentials
 * @param fn
 */
User.changePassword = function(credentials,fn){

    async.waterfall([
        function (callback) {
            bcrypt.compare(credentials.currentpassword, credentials.password, function(err, res) {

                if(err) return callback(new CustomError(err,'passcompare'));

                if(res) return callback();

                callback(new CustomError('invalid current password','form'));
            });
        },
        function(callback) {
            bcrypt.genSalt(10, function (err, salt) {
                if (err) return callback(new CustomError(err,'genSalt'));

                callback(null, salt);
            });
        },
        function(salt,callback) {
            bcrypt.hash(credentials.newpassword, salt, function (err, hash) {
                if (err) return callback(new CustomError(err,'hash'));

                callback(null, hash);
            });
        },
        function (hash, callback) {

            var sql = Query('users')
                .update({ password: hash })
                .where('id', credentials.id);

            DB.execute(sql.toString(), callback);
        }
    ], fn);
};


/**
 *
 * @param username
 */
User.getProfile = function (username , fn) {

    async.waterfall([
        function (callback) {

            var sql = Query.select()
                .from('users')
                .where('username',username)
                .limit(1);

            DB.execute(sql.toString(),function (err,rows) {
                if(err) return callback(err);
                
                if(!rows || !rows.length) return callback('404');
                
                callback(null,rows[0]);
            });
        },
        function (userData , callback) {
            var sql = Query.select([
                'contest_participants.cid',
                'contest.title',
                'contest.begin'
            ])
                .from('contest_participants')
                .leftJoin('contest' , 'contest_participants.cid' ,'contest.id')
                .where('contest_participants.uid',userData.id);

            DB.execute(sql.toString(), function (err,rows) {
                if(err) return callback(err);

                callback(null, userData , rows);
            });
        },
        function (userData , contestHistory, callback) {

            var sql = Query.select(
                Query.raw(' GROUP_CONCAT(DISTINCT(CASE WHEN `a`.`status` = 0 THEN `a`.`pid` ELSE NULL END) SEPARATOR \',\') as solvedList '),
                Query.raw(' COUNT(DISTINCT(CASE WHEN `a`.`status` = 0 THEN `a`.`pid` ELSE NULL END)) as solved '),
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 0 THEN 1 ELSE NULL END) as accepted '),  //accepted
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 1 THEN 1 ELSE NULL END) as re '),  //runtime error
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 2 THEN 1 ELSE NULL END) as tle '),  //time limit
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 3 THEN 1 ELSE NULL END) as mle '),  //memory limit
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 7 THEN 1 ELSE NULL END) as ce '),  //compilation error
                Query.raw(' COUNT(CASE WHEN `a`.`status` = 9 THEN 1 ELSE NULL END) as wa ')  //wrong answer
            )
                .count('a.id as totalSubmission')
                .from('submissions as a')
                .where('a.uid',userData.id);

                //.distinct('b.pid as problems')
            DB.execute(sql.toString(), function (err,rows) {
                if(err) return callback(err);

                callback(null, userData , contestHistory, rows);
            });
        }
    ], fn);
};


module.exports = User;











