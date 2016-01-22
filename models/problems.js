var orm         = require('../config/database/orm');
var _           = require('lodash');
var entities    = require('entities');

var table = 'problems';

exports.findById = function (pid,callback) {

    orm.in(table).findAll({
        where:{
            pid: pid
        }
    },function(err,rows){
        callback(err,rows);
    });

};

exports.insert = function(table,inserts,fn){
    orm.in(table).insert(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.update = function(table,inserts,fn){
    orm.in(table).update(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.insertTC = function(table,inserts,fn){
    orm.in(table).insert(inserts, function (err,row) {
        fn(err,row);
    });
};

exports.findTC = function(table,opts,fn){
    orm.in(table).findAll(opts,function(err,rows){
        fn(err,rows);
    });
};

exports.removeTC = function(table,opts,fn){
    orm.in(table).delete(opts,function(err,rows){
        fn(err,rows);
    });
};

exports.decodeToHTML = function(data){
    var obj = {};

    _.forOwn(data, function(value, key) {
        obj[key] = JSON.stringify(entities.decodeHTML(value || '--' ));
    });

    return obj;
};





