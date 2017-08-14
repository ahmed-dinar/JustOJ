'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');
var async = require('async');
var bcrypt = require('bcryptjs');
var rndm = require('rndm');
var Hashids = require('hashids');

var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');
var Paginate = require('../lib/pagination/paginate');
var MyUtil = require('../lib/myutil');
var User = require('./user');


/**
 *
 * @param cid
 * @param indx
 * @param cb
 */
exports.generateUser = function (cid,indx, cb) {

  var password = rndm(10);
  async.waterfall([
    function(callback) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) return callback('salt error');

        callback(null, salt);
      });
    },
    function(salt,callback) {
      bcrypt.hash(password, salt, function (err, hash) {
        if (err) return callback('hash error');

        callback(null, hash);
      });
    },
    function(hash,callback) {

      var sql = Query.insert({
        username: password,   // we will change it
        name: 'randomUser_' + cid + '_' + indx,
        institute: '',
        password: hash,
        email   : password,  //we need password for download
        role    : 'randuser'
      })
                .into('users');

      DB.execute(sql.toString(), callback);
    },
    function(rows, callback) {

      var hashids = new Hashids('randomuser' , 15);
      var username = hashids.encode(rows.insertId);
      console.log('user inserted id: ' + rows.insertId + ' and username: ' + username + ' and password: ' + password);

      var sql = Query('users')
                        .update({ username: username })
                        .where({ 'id': rows.insertId });
      DB.execute(sql.toString(), function (err,row2) {
        if(err) return callback(err);

        callback(null,rows.insertId);
      });
    },
    function (uid ,callback) {
      var sql = Query.insert({ cid: cid, uid: uid }).into('contest_participants');

      DB.execute(sql.toString(), callback);
    }
  ], cb);
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




/**
 *
 * @param cid
 * @param random_password
 * @param insertObj
 * @param cb
 */
exports.insertUser = function (cid, random_password, insertObj, cb) {

  async.waterfall([
    function (callback) {
      findById(cid,function (err,rows) {
        if(err) return callback(err);

        if(!rows || rows.length === 0) return callback('404');

        callback();
      });
    },
    function (callback) {
      User.available(insertObj.username, null,function(err,rows){
        if(err) return callback(err);

        if( rows.length ) return callback('username not available' , 'username already taken by someone');

        callback();
      });
    },
    function(callback) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) return callback('salt error');

        callback(null, salt);
      });
    },
    function(salt,callback) {

      if(random_password)
        insertObj.password = rndm(10);

      insertObj.email = insertObj.password;

      bcrypt.hash(insertObj.password, salt, function (err, hash) {
        if (err) return callback('hash error');

        callback(null, hash);
      });
    },
    function(hash,callback) {
      insertObj.password = hash;
      var sql = Query.insert(insertObj).into('users');
      DB.execute(sql.toString(), callback);
    },
    function (urow ,callback) {
      var sql = Query.insert({ cid: cid, uid: urow.insertId }).into('contest_participants');
      DB.execute(sql.toString(), callback);
    }
  ], cb);
};


/**
 *
 * @param cid
 * @param uid
 * @param insertObj
 * @param cb
 */
exports.editUser = function (cid, uid, insertObj, cb) {

  async.waterfall([
    function (callback) {
      findById(cid,function (err,rows) {
        if(err)
          return callback(err);

        if(!rows || rows.length === 0)
          return callback('404','404');

        callback();
      });
    },
    function (callback) {
      User.available(insertObj.username, null,function(err,rows){
        if(err)
          return callback(err);

        if( rows.length )
          return callback('username not available' , 'username already taken');

        callback();
      });
    },
    function(callback) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err)
          return callback('salt error');

        callback(null, salt);
      });
    },
    function(salt,callback) {

      insertObj.email = insertObj.password;
      bcrypt.hash(insertObj.password, salt, function (err, hash) {
        if (err)
          return callback('hash error');

        callback(null, hash);
      });
    },
    function(hash,callback) {
      insertObj.password = hash;

      var sql = Query('users')
                .update(insertObj)
                .where({ 'id': uid });
      DB.execute(sql.toString(), callback);
    }
  ], cb);
};



/**
 *
 * @param cid
 * @param cb
 */
function findById(cid,cb){
  var sql = Query
    .select(['id'])
    .from('contest')
    .where({ 'id': cid })
    .limit(1);

  DB.execute( sql.toString(), cb);
}
exports.findById = findById;



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



// /**
//  *
//  * @param cb
//  */
// exports.getPublic = function(cb){
//   async.waterfall([
//     function(callback) {
//       getRunning(callback);
//     },
//     function(running,callback){
//       getFuture(running,callback);
//     },
//     function(running,future,callback){
//       getEnded(running,future,callback);
//     }
//   ], cb);
// };


/**
 *
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.getPastContests = function (cur_page,URL,cb) {

  var sql = Query.select(['cnts.*'])
        .count('usr.id as users')
        .from('contest as cnts')
        .leftJoin('contest_participants as usr', 'usr.cid', 'cnts.id')
        .where(
            Query.raw('`status` = 2 AND `end` <= NOW()')
        )
        .groupBy('cnts.id')
        .orderBy('cnts.begin','desc');

  var sqlCount = Query.count('* as count')
        .from('contest')
        .where(
            Query.raw('`status` = 2 AND `end` <= NOW()')
        );

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: 20,
    sqlCount: sqlCount,
    url: URL
  }, cb);
};


/**
 *  get Participants list of a contest
 * @param cid
 * @param cur_page
 * @param URL
 * @param LIMIT
 * @param cb
 */
exports.getParticipants = function (cid,cur_page,URL,LIMIT,cb) {

  var sql = Query.select(['cp.*','usr.username','usr.email as password','usr.name','usr.institute'])
        .from('contest_participants as cp')
        .leftJoin('users as usr', 'cp.uid', 'usr.id')
        .where('cp.cid', cid)
        .orderBy('usr.username','desc');

  var sqlCount = Query.count('* as count')
        .from('contest_participants')
        .where('cid', cid);

  if( LIMIT < 50 || LIMIT > 200 )
    LIMIT = 100;

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: LIMIT,
    sqlCount: sqlCount,
    url: URL
  }, cb);
};


/**
 *
 * @param cid
 * @param cb
 */
exports.downloadParticipants = function (cid,cb) {

  var sql = Query.select(['usr.username','usr.email as password'])
        .from('contest_participants as cp')
        .leftJoin('users as usr', 'cp.uid', 'usr.id')
        .where('cp.cid', cid)
        .orderBy('usr.username','desc');

  DB.execute( sql.toString(), cb);
};





/**
 *
 * @param cid
 * @param userid
 * @param cb
 */
exports.removeUser = function (cid, userid, cb) {

  var isMulti = _.isArray(userid);
  async.waterfall([
    function (callback) {
      findById(cid,function (err,rows) {
        if(err) return callback(err);

        if(!rows || rows.length === 0) return callback('404');

        callback();
      });
    },
    function(callback) {

      var sql;

      if( isMulti ){
        sql = Query('contest_participants')
                    .whereIn('uid', userid)
                    .andWhere('cid',cid)
                    .del();
      }else {
        sql = Query('contest_participants').where(
                    Query.raw('cid = ? AND uid = ?', [cid, userid.userid])
                ).del();
      }

      DB.execute(sql.toString(), callback);
    },
    function (urow,callback) {

      var sql;

      if( isMulti )
        sql = Query('users').whereIn('id',userid).del();
      else
        sql = Query('users').where('id',userid.userid).del();

      DB.execute(sql.toString(), callback);
    }
  ], cb);
};


/**
 *
 * @param cid
 * @param cb
 */
exports.removealluser = function (cid, cb) {

  async.waterfall([
    function (callback) {
      findById(cid,function (err,rows) {
        if(err) return callback(err);

        if(!rows || rows.length === 0) return callback('404');

        callback();
      });
    },
    function(callback) {
      var sql = Query('users').where(
                Query.raw('`id` IN ( SELECT `uid` FROM `contest_participants` WHERE `cid` = ? )' , [cid])
            ).del();
      DB.execute(sql.toString(), callback);
    },
    function (urow,callback) {
      var sql = Query('contest_participants').where(
                Query.raw('cid = ?',[cid])
            ).del();
      DB.execute(sql.toString(), callback);
    }
  ], cb);
};



//
//
//
exports.running = function(fn){

  var sql = Query
    .select(['cnts.*'])
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

  var sql = Query.select(['cnts.*'])
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

  var sql = Query.select(['cnts.*'])
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
// Get contest that is still running or not yet started for edit by admin/moderator
//
exports.editable = function(fn){
  var sql = Query
    .select()
    .from('contest')
    .where(Query.raw('`end` > NOW()'))
    .toString();

  DB.execute(sql, fn);
};





/**
 * Update contest information
 * @param inserts
 * @param cid
 * @param cb
 */
exports.update = function(inserts, cid, cb){

  var sql = Query('contest').update(inserts)
        .where({ 'id': cid });

  DB.execute(sql.toString(),cb);
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



/**
 * Update contest problem
 * @param inserts
 * @param pid
 * @param cb
 */
exports.updateProblem = function(inserts,pid,cb){
  var sql = Query('problems').update(inserts)
        .where({
          'id': pid
        });

  DB.execute(sql.toString(),cb);
};


/**
 * Get details of a specific contest
 * @param cid
 * @param cb
 */
function getDetails(cid,cb){

  var sql = Query.select().from('contest').where('id', cid).limit(1);

  DB.execute(sql.toString(),cb);
}
exports.getDetails = getDetails; //for using in this file


/**
 * Get details of a specific contest also check is a specific user resistered for this contest
 * @param cid
 * @param uid
 * @param cb
 */
exports.getDetailsIsReg = function (cid,uid,cb){

  var sql;

  if(uid<1) {
    sql = Query.select([
      'c.*',
      Query.raw('GROUP_CONCAT( \'"\' , `list`.`pid` , \'":{\' , \'"pid":\' , `list`.`pid` , \',"name":\' ,`list`.`pname` , \',"title":"\' , `list`.`title` , \'"}\' ORDER BY `list`.`pname` SEPARATOR \',\' ) as `problemList`')
    ]).from('contest as c')
             .where('c.id', cid)
             .joinRaw('  LEFT JOIN('+
             'SELECT `cp`.`cid`,`cp`.`pid`,`cp`.`pname`,`p`.`title`'+
             'FROM `contest_problems` as `cp`'+
             ' LEFT JOIN `problems` as `p` ON `cp`.`pid`=`p`.`id`'+
             'GROUP BY `cp`.`pid`'+
             ') AS `list` ON `c`.`id` = `list`.`cid`'
         )
             .limit(1);
  }else{
    sql = Query.select([
      'c.*',
      Query.raw('ifnull(`cp`.`id`,-1) as `isReg`'),
      Query.raw('GROUP_CONCAT( \'"\' , `list`.`pid` , \'":{\' , \'"pid":\' , `list`.`pid` , \',"name":\' ,`list`.`pname` , \',"title":"\' , `list`.`title` , \'"}\' ORDER BY `list`.`pname` SEPARATOR \',\' ) as `problemList`')
    ])
            .from('contest as c')
            .joinRaw('left join `contest_participants` as `cp` on `c`.`id`=`cp`.`cid` and `cp`.`uid`=?',[uid])
            .joinRaw('  LEFT JOIN('+
            'SELECT `cp`.`cid`,`cp`.`pid`,`cp`.`pname`,`p`.`title`'+
            'FROM `contest_problems` as `cp`'+
            ' LEFT JOIN `problems` as `p` ON `cp`.`pid`=`p`.`id`'+
            'GROUP BY `cp`.`pid`'+
            ') AS `list` ON `c`.`id` = `list`.`cid`'
        )
            .where('c.id', cid)
            .limit(1);
  }

  DB.execute(sql.toString(),cb);
};


/**
 * Get details of a specific contest also all problems of this contest
 * @param cid
 * @param cb
 */
exports.getDetailsAndProblemList = function(cid,cb){

  var sql = Query.select([
    'c.*',
    Query.raw('GROUP_CONCAT( \'"\' , `list`.`pid` , \'":{\' , \'"pid":\' , `list`.`pid` , \',"name":\' ,`list`.`pname` , \',"title":"\' , `list`.`title` , \'"}\' ORDER BY `list`.`pname` SEPARATOR \',\' ) as `problemList`')
  ])
        .from('contest as c')
        .joinRaw('  LEFT JOIN('+
                    'SELECT `cp`.`cid`,`cp`.`pid`,`cp`.`pname`,`p`.`title`'+
                             'FROM `contest_problems` as `cp`'+
                              ' LEFT JOIN `problems` as `p` ON `cp`.`pid`=`p`.`id`'+
                             'GROUP BY `cp`.`pid`'+
                    ') AS `list` ON `c`.`id` = `list`.`cid`'
        )
        .where('c.id', cid)
        .limit(1);

  DB.execute(sql.toString(),cb);
};


/**
 * Get problem list of a specific contest
 * @param cid
 * @param cb
 */
exports.getProblems = function(cid,cb){

  var sql = Query.select(['contest_problems.pid','contest_problems.pname','problems.title','problems.status'])
        .from('contest_problems')
        .leftJoin('problems', 'contest_problems.pid', 'problems.id')
        .where('contest_problems.cid', cid)
        .as('ignored_alias');

  DB.execute(sql.toString(),cb);
};


/**
 * Get problem list of a specific contest including statictics of problems
 * @param cid
 * @param uid
 * @param cb
 */
exports.getDashboardProblems = function(cid,uid,cb){

  var sql;
  if(uid!==-1){ //if user logged in

    sql = Query.select([
      'cp.pid','cp.pname', 'prob.title',
      Query.raw('COUNT(DISTINCT `solved`.`uacc`) as `accepted`'),
      Query.raw('ifnull(`isac`.`isuac`,-1) as `yousolved`'),
      Query.raw('ifnull(`iswa`.`isuwa`,-1) as `youtried`')
    ])
            .from('contest_problems as cp')
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('left join (SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uacc` FROM `contest_rank` as `cr` WHERE `cr`.`cid` = ? AND `cr`.`status`=0) as `solved` ON `cp`.`pid` = `solved`.`ppid`',[cid])
            .joinRaw('left JOIN(SELECT `cr3`.`pid` as `isuwa` FROM `contest_rank` as `cr3` WHERE `cr3`.`cid` = ? AND NOT `cr3`.`status`=0 AND `cr3`.`uid`=?) as `iswa` on `cp`.`pid`=`iswa`.`isuwa`',[cid,uid])
            .joinRaw('left JOIN(SELECT `cr2`.`pid` as `isuac` FROM `contest_rank` as `cr2` WHERE `cr2`.`cid` = ? AND `cr2`.`status`=0 AND `cr2`.`uid`=?) as `isac` on `cp`.`pid`=`isac`.`isuac`',[cid,uid])
            .where('cp.cid', cid)
            .as('ignored_alias')
            .groupBy('cp.pid');

  }else{

    sql = Query.select([
      'cp.pid', 'cp.pname', 'prob.title',
      Query.raw('COUNT(DISTINCT `solved`.`uac`) as `accepted`')
    ])
            .from('contest_problems as cp')
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('left join (SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac` FROM `contest_rank` as `cr` WHERE `cr`.`cid` =? AND `cr`.`status`=0) as `solved` ON `cp`.`pid` = `solved`.`ppid`',[cid])
            .where('cp.cid', cid)
            .as('ignored_alias')
            .groupBy('cp.pid');
  }

  DB.execute(sql.toString(),cb);
};


/**
 * Get details of a contest and a specific problem of this contest
 * @param cid
 * @param pid
 * @param cb
 */
exports.getDetailsandProblem = function(cid,pid,cb){

  var sql = Query.select([
    'cn.*','pb.id as pid','pb.title as probTitle','pb.statement','pb.input','pb.output','pb.score','pb.cpu','pb.memory'
  ])
        .from('contest as cn')
        .joinRaw(' left join `contest_problems` as `cp` ON `cn`.`id` = `cp`.`cid` AND `cp`.`pid` = ?',[pid])
        .joinRaw(' left join `problems` as `pb` ON `pb`.`id` = ?',[pid])
        .where('cn.id', cid)
        .limit(1);

  DB.execute(sql.toString(),cb);
};


/**
 * Get a user submission history of a problem
 * @param cid
 * @param pid
 * @param uid
 * @param cb
 */
exports.getUserProblemSubmissions = function(cid,pid,uid,cb){

  var sql = Query
                .select(['status','submittime','language'])
                .from('contest_submissions')
                .where({
                  cid: cid,
                  pid: pid,
                  uid: uid
                })
                .orderBy('submittime','desc')
                .limit(4);

  DB.execute(sql.toString(),cb);
};


/**
 * Get all submissions of a contest
 * @param cid
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.getSubmissions = function(cid,cur_page,URL,cb){

  var sql = Query.select([
    'submissions.id',
    'submissions.status',
    'submissions.language',
    'submissions.submittime',
    'submissions.cpu',
    'submissions.memory',
    'submissions.pid',
    'users.username',
    'problems.title'
  ])
        .from('contest_submissions as submissions')
        .orderBy('submissions.submittime', 'desc')
        .leftJoin('users', 'submissions.uid', 'users.id')
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .where('submissions.cid',cid);

  var sqlCount = Query.countDistinct('id as count')
        .from('contest_submissions')
        .where('cid',cid);

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: 25,
    sqlCount: sqlCount,
    url: URL
  },
        cb);
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



/**
 * Get all submissions of a contest of a user
 * @param cid
 * @param username
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.getUserSubmissions = function(cid,username,cur_page,URL,cb){

  var sql = Query.select([
    'user.username',
    'submissions.id',
    'submissions.status',
    'submissions.language',
    'submissions.submittime',
    'submissions.cpu',
    'submissions.memory',
    'submissions.pid',
    'problems.title'
  ])
        .from('users as user')
        .joinRaw('LEFT JOIN contest_submissions as submissions ON user.id = submissions.uid AND submissions.cid = ?',[cid])
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .where({
          'user.username': username
        }).orderBy('submissions.submittime', 'desc');

  var sqlCount = Query.count('submissions.id as count')
        .from('users as user')
        .joinRaw('LEFT JOIN contest_submissions as submissions ON user.id = submissions.uid AND submissions.cid = ?',[cid])
        .where({
          'user.username': username
        });

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: 20,
    sqlCount: sqlCount,
    url: URL
  }, cb);
};



/**
 *
 * @param cid
 * @param username
 * @param cb
 */
exports.getUserSubmissionByProblem = function(cid,pid,username,cb){

  var sql = Query.select([
    'submissions.*',
    'problems.title'
  ])
        .from('contest_submissions as submissions')
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .joinRaw('LEFT JOIN `users` ON `submissions`.`uid` = `users`.`id` AND `users`.`username` = ?',[username])
        .where({
          'submissions.cid': cid,
          'submissions.pid': pid,
          'users.username': username
        })
        .orderBy('submissions.submittime', 'desc');

  DB.execute(sql.toString(),cb);
};


/**
 * Check if a user resitered for a specific contest
 * @param cid
 * @param uid
 * @param cb
 */
exports.isRegistered = function(cid,uid,cb){

  var sql = Query.select(['id']).from('contest_participants').where({
    cid: cid,
    uid: uid
  }).limit(1);

  DB.execute(sql.toString(),cb);
};


/**
 * Check if a user resitered for a specific valid contest
 * @param cid
 * @param uid
 * @param cb
 */
exports.findAndisRegistered = function(cid,uid,cb){

  var sql = Query.select([
    'contest.id',
    Query.raw('(`contest_participants`.`uid` IS NOT NULL) AS `resistered`')
  ])
        .joinRaw('LEFT JOIN `contest_participants` ON `contest`.`id` = `contest_participants`.`cid` AND `contest_participants`.`uid` = ?',[uid])
        .from('contest')
        .where('contest.id',cid)
        .limit(1);

  DB.execute(sql.toString(),cb);
};





/**
 * Resister for contest
 * @param cid
 * @param uid
 * @param cb
 */
exports.register = function(cid,uid,cb){

  var sql = Query.insert({
    cid: cid,
    uid: uid
  }).into('contest_participants');

  DB.execute(sql.toString(),cb);
};


/**
 * Create problem for a specific contest
 * @param cid
 * @param pid
 * @param cb
 */
exports.insertProblem = function(cid,pid,cb){

  var sql = Query.insert({
    'cid': cid,
    'pid': pid
  })
        .into('contest_problems');

  DB.execute(sql.toString(),cb);
};


/**
 *
 * @param inserts
 * @param cb
 */
exports.addTestCase = function(inserts,cb){
  var sql = Query.insert(inserts)
        .into('c_submission_case');

  DB.execute(
        sql.toString()
        ,function(err,rows){
          cb(err);
        });
};


/**
 *
 * @param inserts
 * @param cb
 * @constructor
 */
exports.InsertSubmission = function(inserts,cb){

  var sql = Query.insert(inserts)
        .into('contest_submissions');

  DB.execute(
        sql.toString()
        ,function(err,rows){
          if( err ){ return cb(err); }

          cb(null,rows.insertId);
        });
};


/**
 *
 * @param inserts
 * @param cb
 */
exports.insertCode = function(inserts,cb){
  var sql = Query.insert(inserts)
        .into('c_submission_code');

  DB.execute(
        sql.toString()
        ,function(err,rows){
          cb(err);
        });
};

/**
 *
 * @param sid
 * @param inserts
 * @param cb
 * @constructor
 */
exports.UpdateSubmission = function(sid,inserts,cb){

  var sql = Query('contest_submissions').update(inserts).where('id',sid);

  DB.execute(
        sql.toString()
        ,function(err,rows){
          cb(err);
        });
};


/**
 *  TODO: this is bad,right? so many queries?? may be use mysql PROCEDURE?? what do you think?
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


/**
 *
 * @param cid
 * @param withTried
 * @param cb
 */
function getProblemStats(cid,withTried,cb){

  var sql;

    //with tried team count
  if(withTried){
    sql = Query.select([
      'cp.pid',
      'prob.title',
      Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`'),
      Query.raw('ifnull(`wa`.`tried`,0) as `triedBy`')
    ])
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('  LEFT JOIN( ' +
                        'SELECT COUNT(DISTINCT `cs2`.`uid`) as `tried`,`cs2`.`pid` ' +
                        'FROM `contest_submissions` as `cs2` ' +
                        'WHERE `cs2`.`cid`=? ' +
                        'GROUP BY `cs2`.`pid` ' +
                     ') as `wa` on `cp`.`pid` = `wa`.`pid`',[cid]);
  }else{
    sql = Query.select([
      'cp.pid',
      'prob.title',
      Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`')
    ])
            .leftJoin('problems as prob', 'cp.pid', 'prob.id');
  }

  sql = sql.from('contest_problems as cp')
        .joinRaw('  LEFT JOIN( ' +
                        'SELECT COUNT(DISTINCT `cs`.`uid`) as `solved`,`cs`.`pid` ' +
                        'FROM `contest_submissions` as `cs` ' +
                        'WHERE `cs`.`status` = 0 AND `cs`.`cid`=? ' +
                        'GROUP BY `cs`.`pid` ' +
                    ') as `ac` on `cp`.`pid` = `ac`.`pid`',[cid])
        .where('cp.cid', cid)
        .groupBy('cp.pid')
        .as('ignored_alias');

  DB.execute(sql.toString(),cb);
}


/**
 * TODO: this is bad,right? complex queries?? may be use mysql PROCEDURE?? what do you think?
 * @param cid
 * @param cur_page
 * @param url
 * @param cb
 */
exports.getRank = function(cid,cur_page,url,cb){

  async.waterfall([
    function(callback) {
      getDetails(cid,function(err,rows){
        if(err) return callback(err);

        if(!rows.length) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){
      getProblemStats(cid,true,function(err,rows){
        if(err) return callback(err);

        callback(null,contest,rows);
      });
    },
    function(contest,problemStats,callback){

      var sqlInner = Query.select([
        'rank.uid as ruid',
        Query.raw('SUM(CASE WHEN `rank`.`status`=0 THEN ifnull(`rank`.`tried`,1)-1 ELSE 0 END) * 20 + ifnull(SUM(CASE WHEN `rank`.`status`=0 THEN TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ELSE 0 END),0) AS `penalty`',[contest.begin]),
        Query.raw('COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`'),
        Query.raw('GROUP_CONCAT( \'"\' ,`rank`.`pid` , \'":{\' , \'"status":\' , `rank`.`status` , \',"tried":\' , `rank`.`tried` ,  \',"penalty_time":"\' , TIME_FORMAT(TIMEDIFF(`rank`.`penalty`,?), \'%H:%i:%s\')    ,   \'","penalty":\' , TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ,\'}\'  ORDER BY `rank`.`pid` SEPARATOR \',\') as `problems`',[contest.begin,contest.begin]),
      ])
                .from('contest_rank as rank')
                .where('rank.cid',cid)
                .groupBy('rank.uid')
                .as('ignored_alias');

      var sql = Query.select([
        'cp.uid',
        'csu.username',
        'csu.name',
        'r.penalty',
        'r.problems',
        'r.solved'
      ])
                    .from('contest_participants as cp')
                    .leftJoin('users as csu','cp.uid','csu.id')
                    .joinRaw('left join(' + sqlInner.toString() + ')AS `r` ON `cp`.`uid` = `r`.`ruid`')
                    .where('cp.cid',cid)
                    .groupBy('cp.uid')
                    .orderByRaw('r.solved DESC,r.penalty')
                    .as('ignored_alias');


      var sqlCount = Query('contest_participants').countDistinct('uid as count')
                .where('cid',cid);

      Paginate.paginate({
        cur_page: cur_page,
        sql: sql,
        sqlCount: sqlCount,
        limit: 100,
        url: url
      },
                function(err,rows,pagination) {
                  callback(err,contest,problemStats,rows,pagination);
                });
    }
  ], cb);
};


/**
 *
 * @param cid
 * @param clid
 * @param cb
 */
exports.getClarification = function(cid,clid,cb){

  var sql = Query.select([
    'cc.request',
    'cc.response',
    'cc.status',
    'cu.username',
    Query.raw('ifnull(`pp`.`title`,\'\') as `title`'),
    Query.raw('ifnull(`cp`.`pname`,\'General\') as `pname`')
  ])
        .from('contest_clarifications as cc')
        .leftJoin('users as cu','cc.uid','cu.id')
        .leftJoin('problems as pp', 'cc.pid', 'pp.id')
        .leftJoin('contest_problems as cp', 'cc.pid', 'cp.pid')
        .where({
          'cc.id': clid,
          'cc.cid': cid
        }).limit(1);

  DB.execute(sql.toString(),cb);
};


/**
 *
 * @param cid
 * @param clid
 * @param updateObj
 * @param fn
 */
exports.updateClarification = function(cid, clid, updateObj, fn){

  var sql = Query('contest_clarifications')
        .update(updateObj)
        .where({
          'id': clid,
          'cid': cid
        });

  DB.execute(sql.toString(), fn);
};


/**
 *
 * @param cid
 * @param clid
 * @param fn
 */
exports.deleteClarification = function(cid, clid, fn){

  var sql = Query('contest_clarifications')
        .where({
          'id': clid,
          'cid': cid
        })
        .del();

  DB.execute(sql.toString(), fn);
};


/**
 *
 * @param cid
 * @param qid
 * @param cur_page
 * @param url
 * @param cb
 */
exports.getClarifications = function(cid,uid,qid,cur_page,url,cb){

  var sql = Query.select([
    'cc.id',
    'cc.request',
    'cc.response',
    'cc.status',
    Query.raw('ifnull(`pp`.`title`,\'\') as `title`'),
    Query.raw('ifnull(`cp`.`pname`,\'General\') as `pname`')
  ])
        .from('contest_clarifications as cc')
        .leftJoin('problems as pp', 'cc.pid', 'pp.id')
        .leftJoin('contest_problems as cp', 'cc.pid', 'cp.pid');


  if( MyUtil.isNumeric(qid) ){
    sql = sql.where({
      'cc.cid': cid,
      'cc.pid': qid
    });
  }else if( qid === 'general' ){
    sql = sql.where({
      'cc.cid':cid,
      'cc.pid': 0
    });
  }
  else if( qid === 'my' ){
    sql = sql.where({
      'cc.cid':cid,
      'cc.uid': uid
    });
  }
  else{
    sql = sql.where('cc.cid',cid);
  }

  var sqlCount = Query.countDistinct('id as count')
        .from('contest_clarifications')
        .where('cid',cid);

  Paginate.paginate({
    cur_page: cur_page,
    sql: sql,
    limit: 20,
    sqlCount: sqlCount,
    url: url
  }, cb);
};


/**
 *
 * @param inserts
 * @param cb
 */
exports.insertClarification = function (inserts,cb){

  var sql = Query.insert(inserts).into('contest_clarifications');

  DB.execute(sql.toString(),cb);
};
