'use strict';

var Query = require('../config/db/query');
var DB = require('../config/db/DB');
var async = require('async');

function Contest(id){
  this.id = id;
}


Contest.prototype.find = function(columns, fn){
  var sql = (!columns || columns === undefined)
    ? Query.select()
    : Query.select(columns);

  sql = sql.from('contest_submissions as s')
    .leftJoin('problems as p','s.pid','p.id')
    .where({ 's.id': this.id })
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};

Contest.prototype.put = function(columns, fn){
  var sql = Query('contest_submissions')
    .update(columns)
    .where('id', this.id)
    .toString();

  DB.execute(sql, fn);
};



Contest.prototype.saveCase = function(columns, fn){
  var sql = Query.insert(columns)
    .into('contest_runs')
    .toString();

  DB.execute(sql, fn);
};



//
// cid, uid, pid, finalCode
//
Contest.prototype.putRank = function(cid, uid, pid, finalCode, fn){

  var sql;

  async.waterfall([
    function(callback) {

      sql = Query
        .select(['id','status'])
        .from('rank')
        .whereRaw('`cid` = ? AND `uid` = ? AND `pid` = ? AND (`status` = ? OR NOT EXISTS (SELECT `id` FROM `rank` WHERE `cid` = ? AND `uid` = ? AND `pid` = ? AND `status` = ? LIMIT 1))', [cid, uid, pid, 0, cid, uid, pid, 0])
        .limit(1)
        .toString();

      DB.execute(sql, function(err,rows){
        if(err){
          return callback(err);
        }

        console.log('in putRank ');
        console.log(rows);

        //first time submission for this problem
        if(!rows.length){
          return callback(null, -2, -1);
        }

        return callback(null, parseInt(rows[0].status), rows[0].id);
      });
    },
    function(status, rankId, callback) {

      //IGNORE UPDATE! ALREADY ACCEPTED!
      if( status === 0 ){
        console.log('IGNORE UPDATE! ALREADY ACCEPTED!');
        return callback();
      }

      //first time submission for this problem
      if(status===-2){

        sql = Query
          .insert({
            cid: cid,
            uid: uid,
            pid: pid,
            status: finalCode,
            tried: 1
          })
          .into('rank')
          .toString();

        return DB.execute(sql, callback);
      }

      //already submitted but not accpeted
      sql = Query('rank')
        .update({
          status: finalCode,
          tried: Query.raw('`tried` + 1')
        })
        .where('id', rankId)
        .toString();

      return DB.execute(sql, callback);
    }
  ], fn);
};



module.exports = Contest;
