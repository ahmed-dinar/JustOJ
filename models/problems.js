
var Query       = require('../config/database/query');
var MyUtil      = require('../helpers/myutil');
var _           = require('lodash');
var entities    = require('entities');
var async       = require('async');

var table = 'problems';

exports.findById = function (pid,attr,callback) {

    Query.in(table).findAll({
        attributes: attr,
        where:{
            id: pid
        },
        limit: 1
    },function(err,rows){
        callback(err,rows);
    });

};


/**
 *
 * @param req
 * @param fn
 */
exports.insert = function(req,fn){

    async.waterfall([
        function(callback) {
            insertProblem(req,callback);
        },
        function(pid,callback){
            insertTags(req,pid,callback);
        }
    ], function (error, pid) {
        fn(error,pid);
    });

};



/**
 *
 * @param req
 * @param fn
 */
exports.update = function(req,fn){

    async.waterfall([
        function(callback) {
            updateProblem(req,callback);
        },
        function(callback){
            deleteTags(req,callback);
        },
        function(callback){
            insertTags(req,req.params.pid,callback);
        }
    ], function (error, pid) {
        fn(error,pid);
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



var updateProblem = function(req,callback){

    var inserts = {
        attributes:{
            title: entities.encodeHTML(req.body.title),
            status: 'incomplete',
            input: entities.encodeHTML(req.body.input),
            output: entities.encodeHTML(req.body.output),
            author: entities.encodeHTML(req.body.author),
            score: entities.encodeHTML(req.body.score),
            statement: entities.encodeHTML(req.body.statement)
        },
        where:{
            id: req.params.pid
        }
    };

    Query.in('problems').update(inserts, function (err,row) {

        if( err ){ return callback(err); }

        callback();
    });

};


var deleteTags = function(req,callback){

    var inserts = {
        where:{
            pid: req.params.pid
        }
    };

    Query.in('problem_tags').delete(inserts, function (err, row) {

        if( err ){ return callback(err); }

        callback();
    });

};

var insertProblem = function(req,callback){
    var inserts = {
        title: entities.encodeHTML(req.body.title),
        status: 'incomplete',
        input: entities.encodeHTML(req.body.input),
        output: entities.encodeHTML(req.body.output),
        author: entities.encodeHTML(req.body.author),
        statement: entities.encodeHTML(req.body.statement),
        score: entities.encodeHTML(req.body.score)
    };

    Query.in('problems').insert(inserts, function (err,row) {

        if( err ) { return callback(err); }

        callback(null,row.insertId);
    });
};


var insertTags = function(req,pid,callback){

    var values = [];
    _.forEach(MyUtil.tagList(),function(tag){
        if( req.body[tag] || req.body[tag] !== undefined ){
            var value = [];
            value.push(pid,tag);
            values.push(value);
        }
    });

    if( !values.length ){
        return callback(null,pid);
    }

    var inserts = {
        columns:['pid','tag'],
        values: values
    };
    Query.in('problem_tags').insertMultiple(inserts,function(err,row){

        if( err ) { return callback(err); }

        callback(null,pid);
    });
};




