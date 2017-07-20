'use strict';

var mysql = require('mysql');
var config = require('nconf');

var pool = mysql.createPool({
  host            : config.get('DB:HOST') || 'database',
  user            : config.get('DB:USER') || 'user',
  password        : config.get('DB:PASS') || '',
  database        : config.get('DB:NAME') || 'dbname',
  connectionLimit : config.get('DB:LIMIT') || 20
});


exports.getConnection = function (callback) {
  pool.getConnection(callback);
};