'use strict';

//
// Module dependencies
//
var winston = require('winston');
var path = require('path');
var nconf = require('nconf');
var chalk = require('chalk');

console.log( chalk.cyan('Loading and setup logger...') );

var ENV = nconf.get('NODE:ENV') || 'development';

Date.prototype.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
Date.prototype.getMonthName = function() {
  return this.monthNames[this.getMonth()];
};


//logger custom log levels
var levels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  },
  colors: {
    fatal: 'magenta',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
    debug: 'blue'
  }
};


winston.emitErrs = true;
winston.setLevels(levels.levels);
winston.addColors(levels.colors);

winston.add(winston.transports.File, {
  level: 'info',
  timestamp: function () {
    var date = new Date();
    return '[' + date.getDate() + '/' + date.getMonthName() + '/' + date.getFullYear() + ':' + date.toLocaleTimeString() + ']';
  },
  filename: path.resolve(__dirname, '../logs/logs.log'),
  handleExceptions: true,
  json: false,
  maxsize: nconf.get('logger:maxsize') || 4194304, //4MB
  maxFiles: nconf.get('logger:maxFiles') || 5,
  colorize: false
});

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  level: ENV === 'development' ? 'debug' : 'info',
  timestamp: function () {
    return '[' + new Date().toTimeString().substr(0, 8) + ']';
  },
  handleExceptions: true,
  json: false,
  prettyPrint: true,
  colorize: true
});
