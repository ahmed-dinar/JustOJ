'use strict';
//
// (c) Ahmed Dinar, 2017
//
var User = appRequire('models/user');
var Promise = require('bluebird');
var moment = require('moment');
var logger = require('winston');


//
// Check if a username already exists
//
function userExists(username){

  return new Promise(function(resolve, reject){
    User.available(username, null, function(err, rows){
      if(err){
        logger.error(err);
        throw err;
      }
      if(rows && rows.length){
        reject(new Error(username + ' already taken'));
        return;
      }
      resolve();
    });
  });
}


//
// check if email already registered
//
function emailExists(email){

  return new Promise(function(resolve, reject){
    User.available(null, email, function(err, rows){
      if(err){
        logger.error(err);
        throw err;
      }
      if(rows && rows.length){
        reject(new Error(email + ' already taken'));
        return;
      }
      resolve();
    });
  });
}


//
// check if the value is a valid duration in format `HH:MM:SS`
//https://stackoverflow.com/questions/14892740/regular-expression-for-hhmmss
function isDuration(value){
  value = value.toString().trim();
  console.log('isDuration:  ' + value);

  return new RegExp(/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/).test(value);
}


//
// if the valueis a valid datetime in given format
// default format `YYYY-MM-DD HH:mm:ss`
//
function isDatetime(value, format){
  format = format || 'YYYY-MM-DD HH:mm:ss';
  console.log('isDatetime:  ' + value + ' = ' + format);
  return moment(value, format).isValid();
}



//
// check if a duration is greter than or equal a given duration.
// value =  must be a valid duration in format `HH:mm:ss`.
// unit =  is one of these: (default: 'M')
//  'm' or 'millisecond'
//  's' or 'second'
//  'M' or 'minute'
//  'h' or 'hour'
//
// duration = integer
//
function minDuration(value, duration, unit){
  if(!isDuration(value)){
    return false;
  }

  unit = unit || 'M';
  duration = parseInt(duration);

  console.log('minDuration: ' + duration + ' ' + unit);

  switch(unit){
    case 'm':
    case 'millisecond':
      return parseInt(moment.duration(value).asMilliseconds()) >= duration;
    case 's':
    case 'second':
      return parseInt(moment.duration(value).asSeconds()) >= duration;
    case 'M':
    case 'minute':
      return parseInt(moment.duration(value).asMinutes()) >= duration;
    case 'h':
    case 'hour':
      return parseInt(moment.duration(value).asHours()) >= duration;
    default:
      throw new Error(unit + ' is an invalid time unit format');
  }
}


module.exports = {
  userExists: userExists,
  emailExists: emailExists,
  isDuration: isDuration,
  isDatetime: isDatetime,
  minDuration: minDuration
};