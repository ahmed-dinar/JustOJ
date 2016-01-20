var mysql      = require('mysql');
var dbPoolConn = require('./dbConnectionPool.js');
var _          = require('lodash');




exports.query = function (sql,callback){

    console.log(sql);

    dbPoolConn.getConnection(function(err, connection) {

        if(err){
            callback(err,null);
            return;
        }

        connection.query(sql, function(err, rows) {

            connection.release();

            if(err){
                callback(err,null);
                return;
            }

            callback(null,rows);

        });
    });
};


exports.insert = function (table,values,callback) {

    var sql = "INSERT INTO ?? SET ?";
    var inserts = [table,values];
    sql = mysql.format(sql, inserts);

    this.query(sql,callback);
};


exports.update = function (table,values,id,callback) {

    var sql = "UPDATE ?? SET ? WHERE ??=?";
    var inserts = [table,values,'id',id];
    sql = mysql.format(sql, inserts);

    this.query(sql,callback);
};

exports.select = function(columns,table,options,callback) {

    var sql = buildQuery('SELECT',columns,table,options);

    if(sql){
        this.query(sql,callback);
    }else{
        callback('error database query',null);
    }

};

exports.delete = function(table,options,callback) {

    var sql = "DELETE FROM ?? WHERE ?? " + options[1] + " ?";
    var inserts = [table, options[0], options[2]];
    sql = mysql.format(sql, inserts);

    this.query(sql,callback);
};





function buildQuery(operation,target,table,options) {

    if(options.length === 3){
        var operators = ['=','>','<','>=','<='];

        var field    = options[0];
        var operator = options[1];
        var value    = options[2];

        if( _.indexOf(operators,operator) != -1 ){

            var sql = operation + " ?? FROM ?? WHERE ?? " + operator +" ?";
            var inserts = [target,table, field, value];

            if(target.length==1 && target[0]=='*'){
                sql = operation + " * FROM ?? WHERE ?? " + operator +" ?";
                inserts = [table, field, value];
            }

            sql = mysql.format(sql, inserts);

            return sql;

        }
        return null;
    }
    return null;
};



