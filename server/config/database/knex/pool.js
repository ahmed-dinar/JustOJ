"use strict";

var mysql = require('mysql');
var nconf = require('nconf');

/**
 * Create mysql connection pool
 * @type {Pool}
 */
var pool = mysql.createPool({
    host            : nconf.get('DB:HOST') || 'database',
    user            : nconf.get('DB:USER') || 'user',
    password        : nconf.get('DB:PASS') || '',
    database        : nconf.get('DB:NAME') || 'dbname',
    connectionLimit : nconf.get('DB:LIMIT') || 20
});


/**
 * export MYSQL connection Instance
 * @param callback
 */
exports.getConnection = function (callback) {
    pool.getConnection(callback);
};