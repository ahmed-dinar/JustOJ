'use strict';

/**
 * Module dependencies.
 */
var forEach = require('lodash/forEach');
var some = require('lodash/some');
var entities = require('entities');
var async = require('async');
var logger = require('winston');
var Hashids = require('hashids');
var config = require('nconf');
var fs = require('fs');
var path = require('path');

var myutil = appRequire('lib/myutil');
var Paginate = appRequire('lib/pagination/paginate');
var DB = appRequire('config/database/knex/DB');
var Query = appRequire('config/database/knex/query');


/**
 *
 * @param pid
 * @param attr
 * @param callback
 */
exports.findById = function (pid, columns,callback) {

  var sql = !columns || columns === undefined
    ? Query.select()
    : Query.select(columns);

  sql = sql.from('problems')
        .where({ 'id': pid })
        .limit(1)
        .toString();

  DB.execute(sql, callback);
};






//
//
//
exports.findByHash = function (hashId, attr, callback) {

  var sql = Query.select();

  if( attr && attr.length ){
    sql = Query.select(attr);
  }

  sql = sql
    .from('problems')
    .where({ 'hash_id': hashId })
    .limit(1)
    .toString();

  DB.execute(sql, callback);
};


/**
 *
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.findProblems = function (uid, cur_page, URL, cb) {

  var sql;
  if (!uid || uid < 0) {
    sql = Query
            .select(['pb.id', 'pb.hash_id', 'pb.slug', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
              Query.raw('IFNULL(pbtry.triedBy,0) AS triedBy'),
              Query.raw('IFNULL(pbs.solvedBy,0) AS solvedBy')
            ])
            .from('problems  as pb');
  }
  else{  //TODO: bad query? disable it
    sql = Query
            .select(['pb.id','pb.hash_id', 'pb.slug', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
              Query.raw('IFNULL(pbtry.triedBy,0) AS triedBy'),
              Query.raw('IFNULL(pbs.solvedBy,0) AS solvedBy'),
              Query.raw('(pbus.pid IS NOT NULL) as youSolved'), //pbus = problem user solved
              Query.raw('(pbut.pid IS NOT NULL) as youTried')   //pbut = problem user tried
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
    sqlCount: Query
      .count('id as count')
      .from('problems')
      .where('status','public'),
    limit: 5,
    url: URL
  }, cb);
};



//
// Find rank of a specific problem
//
exports.findRank = function(pid,fn){
  var sql = Query
    .select(['submissions.uid','submissions.language','users.username'])
    .from('submissions')
    .where({
      'pid': pid,
      'status': '0'
    })
    .leftJoin('users', 'submissions.uid', 'users.id')
    .min('cpu as cpu')
    .groupBy('uid')
    .orderBy('cpu')
    .limit(5)
    .toString();

  DB.execute(sql, fn);
};



//
// Find a problem by id also find its tags
//
exports.findByIdandTags = function(pid, cb){

  var sql = Query.select(
    Query.raw('p.*,(SELECT GROUP_CONCAT(`tag`) FROM `problem_tags` pt WHERE p.`id` =  pt.`pid`) AS `tags`')
  )
  .from('problems as p')
  .where({
    'id': pid
  })
  .limit(1)
  .toString();

  DB.execute(sql, cb);
};



//
// Find User Submissions for a specific problem
//
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


//
// user submission history
//
exports.userSubmissions = function(pid, uid, fn){

  var sql = Query.select(['status','submittime','language'])
    .from('submissions')
    .where({
      'pid': pid,
      'uid': uid
    })
    .orderBy('submittime','desc')
    .limit(5)
    .toString();

  DB.execute(sql, fn);
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

//
// save a new problem in database
//
exports.save = function(data, fn){

  logger.debug(data);

  async.waterfall([
    function saveProblem(callback) {
      var sql = Query.insert({
        title: data.title,
        slug: data.slug,
        status: 'incomplete',
        input: data.input,
        output: data.output,
        author: data.author,
        statement: data.statement,
        score: data.score,
        category: data.category,
        difficulty: data.difficulty
      })
      .into('problems')
      .toString();

      DB.execute(sql, function(err,rows){
        if(err){
          return callback(err);
        }
        return callback(null, rows.insertId);
      });
    },
    function saveHash(pid, callback){
      var hashids = new Hashids(config.get('HASHID:PROBLEM'), 11);
      var hashId = hashids.encode(pid);

      logger.debug('hashid = ',hashId);

      var sql = Query('problems')
        .update({ 'hash_id': hashId })
        .where({ 'id': pid })
        .toString();

      DB.execute(sql, function(err,rows){
        if(err){
          return callback(err);
        }
        return callback(null, hashId, pid);
      });
    },
    function saveTags(hashId, pid, callback){
      //no tags provided
      if(!data.tags){
        return callback(null, hashId);
      }

      //validate tags
      var tagWhitelist = validTags(data.tags, pid);

      if( !tagWhitelist.length ){
        return callback(null, hashId);
      }

      var sql = Query
        .insert(tagWhitelist)
        .into('problem_tags')
        .toString();

      DB.execute(sql, function(err, rows){
        if(err){
          return callback(err);
        }
        return callback(null, hashId);
      });
    }
  ], fn);
};


//
// returns valid tags
//
function validTags(tags, pid){

  var tagWhitelist = [];

  forEach(myutil.tagList(), function(tag){
    var validTag = some(tags, function(tg){
      return tg === tag;
    });

    if(validTag){
      tagWhitelist.push({
        'pid': pid,
        'tag': tag
      });
    }
  });

  return tagWhitelist;
}



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
          if( err )
            return fn(err);

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
exports.updateLimits = function(pid, limits ,fn){

  var sql = Query('problems')
    .update(limits)
    .where({ 'id': pid })
    .toString();

  DB.execute(sql, fn);
};


//
//
//
exports.updateSubmission = function(pid,col,fn){
  var sql = Query('problems')
    .increment(col, 1)
    .where('id', pid)
    .toString();

  DB.execute(sql, fn);
};


/**
 * Update problem by provided columns
 * @param pid
 * @param cols
 * @param fn
 */
exports.updateByColumn = function (pid, cols, fn) {

  var sql = Query('problems')
    .update(cols)
    .where({ 'id': pid })
    .toString();

  DB.execute(sql, fn);
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


/**
 *
 * @param req
 * @param fn
 */
exports.updateContestProblem = function(req,fn){
  return updateProblem(req,fn);
};


//
// check if a problem at lest has one test case
//
exports.hasTestCase = function(pid, fn){
  var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + pid);

  fs.readdir(rootDir, function(err, files) {
    if( err ){
      if( err.code !== 'ENOENT' ){
        return callback(err);
      }
      //ENOENT = no more test case remains
      return fn(null, false);
    }

    //no more test case remains
    if(!files || !files.length){
      return fn(null, false);
    }

    return fn(null, true);
  });
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




