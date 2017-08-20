'use strict';

var _ = require('lodash');
var async = require('async');
var bcrypt = require('bcryptjs');
var rndm = require('rndm');
var has = require('has');

var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');
var Paginate = require('../lib/pagination/paginate');


//
//
//
exports.users = function(cid, orderby, cur_page, fn){

  var sql = Query
    .select(['usr.id','usr.username','usr.website as password','usr.institute','usr.name'])
    .from('participants as p')
    .leftJoin('users as usr', 'p.uid', 'usr.id')
    .where('p.cid', cid)
    .andWhere('usr.role', 'gen');

  if( orderby ){
    sql = sql.orderByRaw(orderby);
  }

  var sqlCount = Query
    .count('* as count')
    .from('participants')
    .where('cid', cid);

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: 50,
    sqlCount: sqlCount,
    url: ''
  }, fn);
};


//
//
//
exports.findProblems = function(cid, columns, fn){
  var sql = Query
    .select(columns)
    .from('problems')
    .where({ 'cid': cid })
    .toString();

  DB.execute(sql, fn);
};


//
// update contest
//
exports.put = function(cid, columns, fn){
  var sql = Query('contest')
    .update(columns)
    .where('id', cid)
    .toString();

  DB.execute(sql, fn);
};



//
// find contest by id
//
exports.find = function(cid, columns, fn){
  var sql = Query('contest')
    .select(columns)
    .where('id', cid)
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};



//
//
//
exports.insertUser = function (cid, insertObj, fn) {

  async.waterfall([
    function(callback) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err){
          return callback(new Error('salt error'));
        }
        callback(null, salt);
      });
    },
    function(salt,callback) {

      //random password
      if( !insertObj.password ){
        insertObj.password = rndm(10);
      }

      //save non hashed password for priting by admin
      insertObj.website = insertObj.password;

      bcrypt.hash(insertObj.password, salt, function (err, hash) {
        if (err){
          return callback(new Error('hash error'));
        }
        callback(null, hash);
      });
    },
    function(hash, callback) {
      insertObj.password = hash;
      insertObj.verified = 1;

      var sql = Query
        .insert(insertObj)
        .into('users')
        .toString();

      DB.execute(sql, callback);
    },
    function (urow ,callback) {
      var sql = Query
      .insert({ cid: cid, uid: urow.insertId })
      .into('participants')
      .toString();

      DB.execute(sql, function(err){
        if(err){
          return callback(err);
        }
        return callback(null, urow.insertId);
      });
    }
  ], fn);
};



//
// update a user data
//
exports.putUser = function (uid, insertObj, fn) {

  //no password update
  if( !insertObj.password ){
    var sql = Query('users')
      .update(insertObj)
      .where('id', uid)
      .toString();

    return DB.execute(sql, fn);
  }

  async.waterfall([
    function(callback) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err){
          return callback(new Error('salt error'));
        }
        callback(null, salt);
      });
    },
    function(salt,callback) {

      //save non hashed password for priting by admin
      insertObj.website = insertObj.password;

      bcrypt.hash(insertObj.password, salt, function (err, hash) {
        if (err){
          return callback(new Error('hash error'));
        }
        callback(null, hash);
      });
    },
    function(hash, callback) {
      insertObj.password = hash;

      var sql = Query('users')
        .update(insertObj)
        .where('id', uid)
        .toString();

      DB.execute(sql, callback);
    }
  ], fn);
};



//
//
//
exports.fetch = function (cid, columns, cb){
  var sql = Query
    .select(columns)
    .from('contest')
    .where({ 'id': cid })
    .limit(1)
    .toString();

  DB.execute(sql, cb);
};


/**
 *
 * @param inserts
 * @param cb
 */
exports.create = function(inserts,cb){
  var sql = Query
    .insert(inserts)
    .into('contest');
  DB.execute( sql.toString(), cb);
};



//
//
//
exports.save = function(columns, cb){
  var sql = Query
    .insert(columns)
    .into('contest')
    .toString();
  DB.execute(sql, cb);
};





//
// all user list of a contest
//
exports.download = function (cid,cb) {

  var sql = Query
    .select(['usr.username','usr.website as password','usr.institute'])
    .from('participants as cp')
    .leftJoin('users as usr', 'cp.uid', 'usr.id')
    .where('cp.cid', cid)
    .orderByRaw('`usr`.`institute` ASC, `usr`.`username` ASC')
    .toString();

  DB.execute(sql, cb);
};




//
//
//
exports.deleteUser = function (cid, uids, fn) {

  var sql;

  if( _.isArray(uids) ){
    //remove one or multiple
    sql = Query('users')
      .whereIn('id', uids)
      .del()
      .toString();
  }
  else{
    //remove all users
    sql = Query('users')
      .where(
        Query.raw('`id` IN ( SELECT `uid` FROM `participants` WHERE `cid` = ? )' , [cid])
      )
      .del()
      .toString();
  }

  DB.execute(sql, fn);
};



//
// contest submissions
//
exports.submissions = function(cid, cur_page, where, pageLimit, fn){

  var sql = Query
    .select([
      'submissions.status',
      'submissions.language',
      'submissions.submittime',
      'submissions.cpu',
      'submissions.memory',
      'submissions.pid',
      'submissions.id',
      'users.username',
      'problems.title',
      'problems.slug'
    ])
    .from('contest_submissions as submissions')
    .where('submissions.cid', cid);

  var sqlCount = Query
    .count('submissions.cid as count')
    .from('contest_submissions as submissions')
    .where('submissions.cid', cid);

  if( !_.isEmpty(where) ){
    sql = sql.andWhere(where);

    if( has(where,'users.username') ){
      sqlCount = sqlCount.leftJoin('users', 'submissions.uid', 'users.id');
    }

    sqlCount = sqlCount.andWhere(where);
  }

  sql = sql
    .orderBy('submissions.submittime', 'desc')
    .leftJoin('users', 'submissions.uid', 'users.id')
    .leftJoin('problems', 'submissions.pid', 'problems.id');

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: pageLimit || 25,
    sqlCount: sqlCount,
    url: ''
  }, fn);
};


//
//
//
exports.running = function(fn){

  var sql = Query
    .select(['cnts.id','cnts.title','cnts.slug','cnts.begin','cnts.end','cnts.privacy'])
    .count('usr.id as users')
    .from('contest as cnts')
    .leftJoin('participants as usr', 'usr.cid', 'cnts.id')
    .where(Query.raw('`cnts`.`status` = 2 AND `cnts`.`begin` <= NOW() AND `cnts`.`end` > NOW()'))
    .groupBy('cnts.id')
    .orderBy('cnts.begin','desc')
    .toString();

  DB.execute(sql, fn);
};


//
//
//
exports.future = function(fn){

  var sql = Query
    .select(['cnts.id','cnts.title','cnts.slug','cnts.begin','cnts.end','cnts.privacy'])
    .count('usr.id as users')
    .from('contest as cnts')
    .leftJoin('participants as usr', 'cnts.id', 'usr.cid')
    .where(Query.raw('`cnts`.`status` = 2 AND `cnts`.`begin` > NOW()'))
    .groupBy('cnts.id')
    .orderBy('cnts.begin')
    .toString();

  DB.execute(sql, fn);
};



//
//
//
exports.past = function(running,future,cb){

  var sql = Query
    .select(['cnts.id','cnts.title','cnts.slug','cnts.begin','cnts.end','cnts.privacy'])
    .count('usr.id as users')
    .from('contest as cnts')
    .leftJoin('contest_participants as usr', 'usr.cid', 'cnts.id')
    .where(Query.raw('`status` = 2 AND `end` <= NOW()'))
    .groupBy('cnts.id')
    .orderBy('cnts.begin','desc')
    .limit(10)
    .toString();

  DB.execute(sql, fn);
};


//
// find contest by if ready
//
exports.ready = function(cid, fn){
  var sql = Query
    .select([
      'c.id',
      Query.raw('(CASE WHEN COUNT(`p`.`id`) < 1 THEN 0 WHEN COUNT(CASE WHEN `p`.`status` = \'incomplete\' THEN 1 END) > 0 THEN 0 ELSE 1 END) as ready')
    ])
    .from('contest as c')
    .leftJoin('problems as p', 'c.id', 'p.cid')
    .where('c.id', cid)
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};


//
// Get contest that is still running or not yet started for edit by admin/moderator
//
exports.editable = function(fn){
  var sql = Query
    .select([
      'c.*',
      Query.raw('(CASE WHEN COUNT(`p`.`id`) < 1 THEN 0 WHEN COUNT(CASE WHEN `p`.`status` = \'incomplete\' THEN 1 END) > 0 THEN 0 ELSE 1 END) as ready')
    ])
    .leftJoin('problems as p', 'c.id', 'p.cid')
    .from('contest as c')
    .where(Query.raw('`c`.`end` > NOW()'))
    .groupBy('c.id')
    .toString();

  DB.execute(sql, fn);
};


//
// Update a contest
//
exports.put = function(cid, columns, fn){
  var sql = Query('contest')
    .update(columns)
    .where({ 'id': cid })
    .toString();

  DB.execute(sql, fn);
};



//
// gte a specific problem
//
exports.problem = function(cid, pid, fn){
  var sql = Query
    .select(['title','slug','status','statement','input','output','score','cpu','memory'])
    .from('problems')
    .where('cid', cid)
    .andWhere('id', pid)
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};



//
// get contest details and if user registered
//
exports.announcement = function(cid, uid, fn){

  var sql;

  if( uid ){
    sql = Query
      .select([
        'c.*',
        Query.raw('CASE WHEN `u`.`cid` IS NULL THEN 0 ELSE 1 END as `joined`'),
      ])
      .from('contest as c')
      .joinRaw('LEFT JOIN(SELECT `cid` FROM `participants` as `cu` WHERE `cu`.`cid` = ? AND `cu`.`uid` = ? LIMIT 1) AS `u` ON `c`.`id` = `u`.`cid`', [cid,uid])
      .where({ 'c.id': cid })
      .limit(1)
      .toString();
  }
  else{
    sql = Query
      .select()
      .from('contest')
      .where('id',cid)
      .limit(1)
      .toString();
  }


  DB.execute(sql, fn);
};



//
// contest dashboard problems
//
// TODO: left join rank, try using LIMIT 1 for `isuwa` and `isuac`
//
exports.dashboard = function(cid, uid, fn){

  var sql;
  if(uid){
    //if user logged in

    sql = Query
    .select([
      'cp.id','cp.title','cp.slug','cp.status',
      Query.raw('COUNT(DISTINCT `solved`.`uacc`) as `accepted`'),
      Query.raw('ifnull(`isac`.`isuac`,-1) as `ac`'),
      Query.raw('ifnull(`iswa`.`isuwa`,-1) as `wa`')
    ])
    .from('problems as cp')
    .joinRaw('left JOIN(SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uacc` FROM `rank` as `cr` WHERE `cr`.`cid` = ? AND `cr`.`status`=0) as `solved` ON `cp`.`id` = `solved`.`ppid`',[cid])
    .joinRaw('left JOIN(SELECT `cr3`.`pid` as `isuwa` FROM `rank` as `cr3` WHERE `cr3`.`cid` = ? AND NOT `cr3`.`status`=0 AND `cr3`.`uid`=?) as `iswa` ON `cp`.`id`=`iswa`.`isuwa`',[cid,uid])
    .joinRaw('left JOIN(SELECT `cr2`.`pid` as `isuac` FROM `rank` as `cr2` WHERE `cr2`.`cid` = ? AND `cr2`.`status`=0 AND `cr2`.`uid`=?) as `isac` ON `cp`.`id`=`isac`.`isuac`',[cid,uid])
    .where('cp.cid', cid)
    .as('ignored_alias')
    .groupBy('cp.id')
    .toString();
  }
  else{

    sql = Query
    .select([
      'cp.id','cp.title','cp.slug','cp.status',
      Query.raw('COUNT(DISTINCT `solved`.`uac`) as `accepted`')
    ])
    .from('problems as cp')
    .joinRaw('left join (SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac` FROM `rank` as `cr` WHERE `cr`.`cid` =? AND `cr`.`status`=0) as `solved` ON `cp`.`id` = `solved`.`ppid`',[cid])
    .where('cp.cid', cid)
    .as('ignored_alias')
    .groupBy('cp.id')
    .toString();
  }



  DB.execute(sql, fn);
};




//
//
//
exports.delete = function (cid, fn) {
  var sql = Query('contest')
  .where('id', cid)
  .del()
  .toString();

  DB.execute(sql, fn);
};



//
// Resister for contest
//
exports.register = function(columns, fn){
  var sql = Query
    .insert(columns)
    .into('contest_participants')
    .toString();

  DB.execute(sql, fn);
};



//
// save test case run information
//
exports.saveRun = function(inserts, fn){
  var sql = Query
    .insert(inserts)
    .into('contest_runs')
    .toString();

  DB.execute(sql,function(err){
    fn(err);
  });
};



//
// save a submisison
//
exports.saveSubmission = function(columns, fn){
  var sql = Query
    .insert(columns)
    .into('contest_submissions')
    .toString();

  DB.execute(sql, function(err,rows){
    if( err ){
      return fn(err);
    }
    return fn(null, rows.insertId);
  });
};



//
// save source code
//
exports.saveSource = function(columns, fn){
  var sql = Query
    .insert(columns)
    .into('contest_source')
    .toString();

  DB.execute(sql,function(err){
    fn(err);
  });
};




//
// update submission
//
exports.putSubmission = function(sid, inserts, fn){
  var sql = Query('contest_submissions')
    .update(inserts)
    .where('id', sid)
    .toString();

  DB.execute(sql,function(err){
    fn(err);
  });
};




/**
 *  TODO: this is bad,right? so many queries?? may be use mysql PROCEDURE?? what do you think? <= shut up -_-
 * @param cid
 * @param uid
 * @param pid
 * @param finalCode
 * @param cb
 * @constructor
 */
exports.UpdateRank = function(cid,uid,pid,finalCode,cb){

  var sql;

  async.waterfall([
    function(callback) {

      sql = Query.select('status')
                .from('contest_rank')
                .where(Query.raw('`cid`=? AND `uid`=? AND `pid`=? AND (`status`=? OR NOT EXISTS (SELECT `id` FROM `contest_rank` WHERE `cid`=? AND `uid`= ? AND `pid`=? AND `status`=? LIMIT 1))',[cid,uid,pid,0,cid,uid,pid,0]))
                .limit(1);

      DB.execute(
                sql.toString()
                ,function(err,rows){
                  if(err){ return callback(err); }

                  if(!rows.length){ return callback(null,-2); }

                  callback(null,rows[0].status);
                });
    },
    function(status,callback) {

            //if first submisions
      if(status===-2){
        sql = Query.insert({
          cid: cid,
          uid: uid,
          pid: pid,
          status: finalCode,
          tried: 1
        }).into('contest_rank');
      }else if(status!==0){  //already not accpeted
        sql = Query('contest_rank').update({
          status: finalCode,
          tried: Query.raw('`tried` + 1')
        })
                     .where({
                       cid: cid,
                       uid: uid,
                       pid: pid
                     });
      }else{
        console.log('IGNORE UPDATE! ALREADY ACCEPTED!!!!!!!!!!!!!!!!!!!!!!!');
        return callback();
      }

      DB.execute(sql.toString(), callback);
    }
  ],cb);
};



//
// opt = {
//  id = contest id
//  time = contest starting time
//  cur_page = pagination current offset
//  limit = total data to query
//  penalty = penalty time for each try
// }
//
exports.rank = function(opt, fn){

  if( !has(opt, 'penalty') ){
    opt.penalty = 20;
  }

  var sqlInner = Query.select([
    'rank.uid as ruid',
    Query.raw('SUM(CASE WHEN `rank`.`status`=0 THEN ifnull(`rank`.`tried`,1)-1 ELSE 0 END) * ? + ifnull(SUM(CASE WHEN `rank`.`status`=0 THEN TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ELSE 0 END),0) AS `penalty`',[opt.penalty, opt.time]),
    Query.raw('COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`'),
    Query.raw('GROUP_CONCAT( \'"\' ,`rank`.`pid` , \'":{\' , \'"status":\' , `rank`.`status` , \',"tried":\' , `rank`.`tried` ,  \',"penalty_time":"\' , TIME_FORMAT(TIMEDIFF(`rank`.`penalty`,?), \'%H:%i:%s\')    ,   \'","penalty":\' , TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ,\'}\'  ORDER BY `rank`.`pid` SEPARATOR \',\') as `problems`',[opt.time, opt.time]),
  ])
  .from('rank')
  .where('rank.cid', opt.id)
  .groupBy('rank.uid')
  .as('ignored_alias')
  .toString();

  var sql = Query.select([
    'cp.uid',
    'csu.username',
    'csu.name',
    'r.penalty',
    'r.problems',
    'r.solved'
  ])
  .from('participants as cp')
  .leftJoin('users as csu','cp.uid','csu.id')
  .joinRaw('left join(' + sqlInner + ') AS `r` ON `cp`.`uid` = `r`.`ruid`')
  .where('cp.cid', opt.id)
  .groupBy('cp.uid')
  .orderByRaw('r.solved DESC, r.penalty')
  .as('ignored_alias');


  var sqlCount = Query('participants')
    .countDistinct('uid as count')
    .where('cid', opt.id);

  Paginate.paginate({
    cur_page: opt.cur_page,
    sql: sql,
    sqlCount: sqlCount,
    limit: opt.limit,
    url: ''
  }, fn);
};


//
// get specific clarification details
//
exports.clar = function(cid, clarId, fn){
  var sql = Query.select([
    'cc.request',
    'cc.response',
    'cc.status',
    'cu.username',
    'pp.title'
  ])
  .from('clar as cc')
  .leftJoin('users as cu','cc.uid','cu.id')
  .leftJoin('problems as pp', 'cc.pid', 'pp.id')
  .where({
    'cc.id': clarId,
    'cc.cid': cid
  })
  .limit(1)
  .toString();

  DB.execute(sql, fn);
};



//
// contest clarifications
// opt = {
//  id = contest id
//  cur_page = offset
//  where = where query
//  limit = total data to show
// }
//
exports.clars = function(opt, fn){

  var sql = Query.select([
    'cc.id',
    'cc.request',
    'cc.response',
    'cc.status',
    'pp.title'
  ])
  .from('clar as cc')
  .leftJoin('problems as pp', 'cc.pid', 'pp.id')
  .where('cc.cid', opt.id);

  var sqlCount = Query.countDistinct('cc.id as count')
    .from('clar as cc')
    .where('cc.cid', opt.id);

  if( !_.isEmpty(opt.where) ){
    if( has(opt.where,'users.username') ){
      sql = sql.leftJoin('users', 'cc.uid', 'users.id');
      sqlCount = sqlCount.leftJoin('users', 'cc.uid', 'users.id');
    }

    sql = sql.andWhere(opt.where);
    sqlCount = sqlCount.andWhere(opt.where);
  }

  Paginate.paginate({
    cur_page: opt.cur_page,
    sql: sql,
    limit: opt.limit,
    sqlCount: sqlCount,
    url: ''
  }, fn);
};




//
// update clarrifation
//
exports.putClar = function(clarId, updateObj, fn){
  var sql = Query('clar')
    .update(updateObj)
    .where('id', clarId)
    .toString();

  DB.execute(sql, fn);
};



//
// delete a clarification
//
exports.deleteClar = function(clarId, fn){
  var sql = Query('clar')
    .where('id', clarId)
    .del()
    .toString();

  DB.execute(sql, fn);
};



//
// save a clarificaiotns
//
exports.saveClar = function (columns, fn){
  var sql = Query
    .insert(columns)
    .into('clar')
    .toString();

  DB.execute(sql, fn);
};





exports.rankStats = function(cid, withTried, fn){

  var sql;

  //with tried team count
  if(withTried){

    sql = Query
    .select([
      'prob.id',
      'prob.title',
      Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`'),
      Query.raw('ifnull(`wa`.`tried`,0) as `triedBy`')
    ])
    .from('problems as prob')
    .joinRaw('  LEFT JOIN( ' +
      'SELECT COUNT(DISTINCT `cs2`.`uid`) as `tried`,`cs2`.`pid` ' +
      'FROM `contest_submissions` as `cs2` ' +
      'WHERE `cs2`.`cid`=? ' +
      'GROUP BY `cs2`.`pid` ' +
      ') as `wa` on `prob`.`id` = `wa`.`pid`',[cid]);

  }
  else{
    sql = Query.select([
      'prob.pid',
      'prob.title',
      Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`')
    ])
    .from('problems as prob');
  }

  sql = sql
  .joinRaw('  LEFT JOIN( ' +
    'SELECT COUNT(DISTINCT `cs`.`uid`) as `solved`,`cs`.`pid` ' +
    'FROM `contest_submissions` as `cs` ' +
    'WHERE `cs`.`status` = 0 AND `cs`.`cid`=? ' +
    'GROUP BY `cs`.`pid` ' +
    ') as `ac` on `prob`.`id` = `ac`.`pid`',[cid])
  .where('prob.cid', cid)
  .groupBy('prob.id')
  .as('ignored_alias')
  .toString();

  DB.execute(sql, fn);
};