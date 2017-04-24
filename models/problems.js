var MyUtil      = require('../helpers/myutil');
var _           = require('lodash');
var entities    = require('entities');
var async       = require('async');

var Paginate    = require('../helpers/paginate');
var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');

var table = 'problems';

var colors      = require('colors');

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
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.findProblems = function (uid,cur_page,URL, cb) {

    var sql;
    if (uid < 0) {
        sql = Query
            .select(['pb.id', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
                Query.raw('IFNULL(pbtry.triedBy,0) AS triedBy'),
                Query.raw('IFNULL(pbs.solvedBy,0) AS solvedBy')
            ])
            .from('problems  as pb');
    }
    else{  //TODO: bad query? disable it
        sql = Query
            .select(['pb.id', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
                Query.raw('IFNULL(pbtry.triedBy,0) AS triedBy'),
                Query.raw('IFNULL(pbs.solvedBy,0) AS solvedBy'),
                Query.raw('(pbus.pid IS NOT NULL) as youSolved'),
                Query.raw('(pbut.pid IS NOT NULL) as youTried')
            ])
            .from('problems  as pb')
            .joinRaw(' LEFT JOIN( ' +
                'SELECT sss.pid ' +
                'FROM submissions as sss ' +
                'WHERE sss.`status` = 0 AND sss.`uid` = ? ' +
                'GROUP BY sss.pid ' +
                ') as pbus ON pb.id = pbus.pid ', [uid])
            .joinRaw(' LEFT JOIN( ' +
                'SELECT sa.pid ' +
                'FROM submissions as sa ' +
                'WHERE sa.`status` != 0 AND sa.`uid` = ? ' +
                'GROUP BY sa.pid ' +
                ') as pbut ON pb.id = pbut.pid ', [uid]);
    }

     sql = sql
        .joinRaw(' LEFT JOIN( ' +
            'SELECT ssss.pid, COUNT(DISTINCT ssss.uid) AS triedBy ' +
            'FROM submissions as ssss ' +
            'GROUP BY ssss.pid ' +
            ') as pbtry ON pb.id = pbtry.pid ')
        .joinRaw(' LEFT JOIN( ' +
            'SELECT ss.pid, COUNT(DISTINCT ss.uid) AS solvedBy ' +
            'FROM submissions as ss ' +
            'WHERE ss.`status` = 0 ' +
            'GROUP BY ss.pid ' +
            ') as pbs ON pb.id = pbs.pid ')
        .where('pb.status', 'public');


    Paginate.paginate({
            cur_page: cur_page,
            sql: sql,
            sqlCount: Query.count('id as count').from('problems').where('status','public'),
            limit: 5,
            url: URL
        }, cb);
};


/**
 * Find rank of a specific problem
 * @param pid
 * @param cb
 */
exports.findRank = function(pid,cb){
    var sql = Query.select(['submissions.uid','submissions.language','users.username'])
        .from('submissions')
        .where({
            'pid': pid,
            'status': '0'
        })
        .leftJoin('users', 'submissions.uid', 'users.id')
        .min('cpu as cpu')
        .groupBy('uid')
        .orderBy('cpu')
        .limit(5);

    DB.execute(sql.toString(),cb);
};



/**
 * Find a problem by id also find its tags
 * @param pid
 * @param cb
 */
exports.findByIdandTags = function(pid,cb){

    var sql = Query.select(
        Query.raw('p.*,(SELECT GROUP_CONCAT(`tag`) FROM `problem_tags` pt WHERE p.`id` =  pt.`pid`) AS `tags`')
    )
        .from('problems as p')
        .where({
            'id': pid
        })
        .limit(1);

    DB.execute(sql.toString(),cb);
};



/**
 * Find User Submissions for a specific problem
 * @param pid
 * @param uid
 * @param cb
 */
exports.findUserSubmissions = function(pid,uid,cb){

    var sql = Query.select(['status','submittime','language'])
        .from('submissions')
        .where({
            'pid': pid,
            'uid': uid
        })
        .orderBy('submittime','desc')
        .limit(5);

    DB.execute(sql.toString(),cb);
};



/**
 * Insert a new problem
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
    ], fn);
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
        difficulty: ''
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




