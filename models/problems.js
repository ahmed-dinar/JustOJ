var MyUtil      = require('../helpers/myutil');
var _           = require('lodash');
var entities    = require('entities');
var async       = require('async');

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');

var table = 'problems';


/**
 *
 * @param pid
 * @param attr
 * @param callback
 */
exports.findById = function (pid,attr,callback) {

    var sql = Query.select();

    if( attr.length ){
        sql = Query.select(attr);
    }

    sql = sql.from('problems')
        .where({ 'id': pid })
        .limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
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
exports.insertContestProblem = function(req,fn){

    var sql = Query.insert({
        title: entities.encodeHTML(req.body.title),
        status: 'incomplete',
        isContest: 1,
        input: entities.encodeHTML(req.body.input),
        output: entities.encodeHTML(req.body.output),
        author: entities.encodeHTML(req.body.author),
        statement: entities.encodeHTML(req.body.statement),
        score: entities.encodeHTML(req.body.score),
        difficulty: '',
        status: 'incomplete'
    })
        .into('problems');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ) { return fn(err); }

            fn(null,rows.insertId);
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


/**
 *
 * @param inserts
 * @param fn
 */
exports.updateLimits = function(pid,limits,fn){

    var sql = Query('problems').update(limits)
        .where({ 'id': pid });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ){ return fn(err); }

            fn();
        });
};


/**
 *
 * @param inserts
 * @param fn
 */
exports.updateSubmission = function(pid,col,fn){

    var sql = Query('problems').increment(col,1).where('id',pid);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ){ return fn(err); }

            fn();
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
            obj[key] = entities.decodeHTML(value);
        }
    });

    return obj;
};


exports.updateContestProblem = function(req,fn){
    updateProblem(req,fn);
};


/**
 *
 * @param req
 * @param callback
 */
var updateProblem = function(req,callback){

    var sql = Query('problems').update({
        title: entities.encodeHTML(req.body.title),
        status: 'incomplete',
        input: entities.encodeHTML(req.body.input),
        output: entities.encodeHTML(req.body.output),
        author: entities.encodeHTML(req.body.author),
        score: entities.encodeHTML(req.body.score),
        statement: entities.encodeHTML(req.body.statement)
    })
        .where({ 'id': req.params.pid });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ){ return callback(err); }

            callback();
        });
};


/**
 *
 * @param req
 * @param callback
 */
var deleteTags = function(req,callback){

    var sql = Query('problem_tags').where({ 'pid': req.params.pid }).del();

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ){ return callback(err); }

            callback();
        });
};


/**
 *
 * @param req
 * @param callback
 */
var insertProblem = function(req,callback){

    var sql = Query.insert({
        title: entities.encodeHTML(req.body.title),
        status: 'incomplete',
        input: entities.encodeHTML(req.body.input),
        output: entities.encodeHTML(req.body.output),
        author: entities.encodeHTML(req.body.author),
        statement: entities.encodeHTML(req.body.statement),
        score: entities.encodeHTML(req.body.score),
        category: req.body.category,
        difficulty: req.body.difficulty
    })
        .into('problems');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ) { return callback(err); }

            callback(null,rows.insertId);
        });
};


/**
 *
 * @param req
 * @param pid
 * @param callback
 * @returns {*}
 */
var insertTags = function(req,pid,callback){

    var inserts = [];
    _.forEach(MyUtil.tagList(),function(tag){
        if( req.body[tag] || !_.isUndefined(req.body[tag]) ){
            var value = {
                'pid': pid,
                'tag': tag
            };
            inserts.push(value);
        }
    });

    //if no tag
    if( !inserts.length ){ return callback(null,pid); }

    var sql = Query.insert(inserts).into('problem_tags');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ) { return callback(err); }

            callback(null,pid);
        });
};




