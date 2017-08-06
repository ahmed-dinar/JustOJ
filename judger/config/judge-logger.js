'use strict';

//
// Module dependencies
//
var winston = require('winston');
var path = require('path');
var chalk = require('chalk');
var config = require('nconf');

var ENV = process.env.NODE_ENV || 'development';
var DEBUG = ENV !== 'production';

console.log( chalk.cyan('Loading and setup worker logger...') );


Date.prototype.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
Date.prototype.getMonthName = function() {
  return this.monthNames[this.getMonth()];
};


winston.emitErrs = true;
winston.setLevels({
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
});

winston.addColors({
  fatal: 'magenta',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  debug: 'blue'
});

winston.add(winston.transports.File, {
  level: 'info',
  timestamp: function () {
    var date = new Date();
    return '[' + date.getDate() + '/' + date.getMonthName() + '/' + date.getFullYear() + ':' + date.toLocaleTimeString() + ']';
  },
  filename: path.resolve(__dirname, '../logs/judge-logs.log'),
  handleExceptions: true,
  json: false,
  maxsize: config.get('logger:maxsize') || 4194304, //4MB
  maxFiles: config.get('logger:maxFiles') || 5,
  colorize: false
});


winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  level: DEBUG ? 'debug' : 'info',
  timestamp: function () {
    return '[' + new Date().toTimeString().substr(0, 8) + ']';
  },
  handleExceptions: true,
  json: false,
  prettyPrint: true,
  colorize: true
});


module.exports = winston;