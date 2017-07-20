'use strict';

/**
* Module dependencies.
*/
var async = require('async');
var bcrypt = require('bcryptjs');
var moment = require('moment');
var crypto = require('crypto');
var assign = require('lodash.assign');
var jwt = require('jsonwebtoken');
var config = require('nconf');

var logger = require('winston');
var DB = appRequire('config/database/knex/DB');
var Query = appRequire('config/database/knex/query');
var AppError = appRequire('lib/custom-error');
var jwtConfig = appRequire('config/jwt');

function User(){}


//
// find a user in database
//
function findUser(username, cb){
  var sql = Query
  .select()
  .from('users')
  .where({
    'username': username
  })
  .limit(1);

  DB.execute(sql.toString(),function(err,user){
    if (err)
      return cb(err);

    if (user.length)
      return cb(null, user[0]);

    return cb(new AppError('not found','404'));
  });
}


//
// validate password
//
function validatePassword(password, user, cb){
  bcrypt.compare(password, user.password, function(err, passed) {
    if(err)
      return cb(err);

    if(passed)
      return cb(null,user);

    return cb(new AppError('invalid','401'));
  });
}

//
//generate jwt token with user payload
//
function generateToken(user, cb){
  var payLoad = {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };

  jwt.sign(payLoad, config.get('jwt:secret'), jwtConfig.options(), function(err, token) {
    if(err)
      return cb(err);

    payLoad.access_token = token;

    return cb(null, payLoad);
  });
}

//
//user authentication/login
//
User.auth = function(username, password, fn){
  async.waterfall([
    async.apply(findUser, username),
    async.apply(validatePassword, password),
    generateToken
  ], fn);
};


//
// Check if a username or email already registered
//
User.available = function(username, email, fn){
  var sql;

  if( username && email ){
    sql = Query.select('username')
    .from('users')
    .where('username', username)
    .orWhere('email',email)
    .limit(1);
  }
  else if( username ){
    sql = Query
    .select('username')
    .from('users')
    .where('username',username)
    .limit(1);
  }
  else if( email ){
    sql = Query
    .select('email')
    .from('users')
    .where('email', email)
    .limit(1);
  }
  else{
    return fn(new Error('username or password required'));
  }

  DB.execute(sql.toString(),fn);
};


//
// password reset token
//
User.setResetToken = function (email,token, callback) {

  var expire = moment()
  .add(24, 'hours')
  .format('YYYY-MM-DD HH:mm:ss');

  var sql = Query('users')
  .update({
    reset_token: token,
    token_expires: expire
  })
  .where('email', email);

  DB.execute(sql.toString(), callback);
};


//
// search a reset token in user datatbase
//
User.getResetToken = function (token, callback) {

  var sql = Query.select(['token_expires','id'])
  .from('users')
  .where('reset_token', token)
  .limit(1);

  DB.execute(sql.toString(), callback);
};


//
// reset user password
//
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



User.problemStatus = function(id,callback){

  var sql = Query.select()
  .from('user_problem_status')
  .where({
    'uid': id
  });

  DB.execute(sql.toString(), callback);
};



User.updateProfile = function(credentials,callback){

  var sql = Query('users')
  .update(credentials.fields)
  .where('id', credentials.id);

  DB.execute(sql.toString(), callback);
};




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





User.save = function(user, fn){
  var data = {
    username: user.username,
    name: user.name,
    email: user.email,
    role: 'user'
  };

  logger.debug('saving started');

  async.waterfall([
    function(callback) {
      logger.debug('generating salt');
      bcrypt.genSalt(10, callback);
    },
    function(salt, callback) {
      logger.debug('generating hash');
      bcrypt.hash(user.password, salt, callback);
    },
    function (hashedPassword, callback) {
      logger.debug('generating token');
      crypto.randomBytes(20, function(err, buf) {
        if(err)
          return callback(err);

        return callback(null, hashedPassword, buf.toString('hex'));
      });
    },
    function(hashedPassword, token, callback) {

      var now = moment();
      var created = moment(now).format('YYYY-MM-DD HH:mm:ss');
      var expire = moment(now)
        .add(24, 'hours')
        .format('YYYY-MM-DD HH:mm:ss');

      data = assign(data,{
        password: hashedPassword,
        joined: created,
        token_expires: expire,
        reset_token: token
      });

      var sql = Query
        .insert(data)
        .into('users')
        .toString();

      DB.execute(sql, function(err,rows){
        if (err)
          return callback(err);

        return callback(null, token);
      });
    }
  ], fn);
};






module.exports = User;











