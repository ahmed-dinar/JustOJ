'use strict';

var forEach = require('lodash/forEach');
var some = require('lodash/some');
var entities = require('entities');
var async = require('async');
var logger = require('winston');
var Hashids = require('hashids');
var config = require('nconf');

var myutil = appRequire('lib/myutil');
var Paginate = appRequire('lib/pagination/paginate');
var DB = appRequire('config/database/knex/DB');
var Query = appRequire('config/database/knex/query');


//
// main class
//
function Problem(id){
  this.id = id;
}


//
// find a problem by its id
//
Problem.prototype.findById = function(){
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
// get all public problems
//
Problem.prototype.findProblems = function (uid, cur_page, URL, cb) {

  var sql;
  if (!uid || parseInt(uid) < 0) {
    sql = Query
      .select(['pb.id', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
        Query.raw('IFNULL(pbtry.triedBy,0) AS triedBy'),
        Query.raw('IFNULL(pbs.solvedBy,0) AS solvedBy')
      ])
      .from('problems  as pb');
  }
  else{
    sql = Query
    .select(['pb.id', 'pb.title', 'pb.submissions', 'pb.solved', 'pb.difficulty',
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
// save a new problem
//
Problem.prototype.save = function(data, fn){

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

module.exports = Problem;