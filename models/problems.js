
var Query         = require('../config/database/query');
var _           = require('lodash');
var entities    = require('entities');

var table = 'problems';

exports.findById = function (pid,callback) {

    Query.in(table).findAll({
        where:{
            pid: pid
        }
    },function(err,rows){
        callback(err,rows);
    });

};

exports.insert = function(table,inserts,fn){
    Query.in(table).insert(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.update = function(table,inserts,fn){
    Query.in(table).update(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.insertTC = function(table,inserts,fn){
    Query.in(table).insert(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.findTC = function(table,opts,fn){
    Query.in(table).findAll(opts,function(err,rows){
        fn(err,rows);
    });
};

exports.removeTC = function(table,opts,fn){
    Query.in(table).delete(opts,function(err,rows){
        fn(err,rows);
    });
};


/**
 *
 * @param data
 * @returns {{}}
 */
exports.decodeToHTML = function(data){
    var obj = {};

    _.forOwn(data, function(value, key) {
        if( value === null ){
            obj[key] = '';
        }else {
            obj[key] = JSON.stringify(entities.decodeHTML(value));
        }
    });

    return obj;
};





