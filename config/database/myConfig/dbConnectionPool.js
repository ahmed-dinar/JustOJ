"use strict"

var mysql = require('mysql');

var pool = mysql.createPool({
    host            : process.env.MYSQL_HOST || '127.0.0.1',
    user            : process.env.MYSQL_USER || 'root',
    password        : process.env.MYSQL_PASS || '',
    database        : process.env.MYSQL_DB   || 'justoj_schema',
    connectionLimit : 20
});

exports.getConnection = function (callback) {
    pool.getConnection(callback);
};