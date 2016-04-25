var _           = require('lodash');
var async       = require('async');

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');
var moment      = require("moment");
var Paginate    = require('../helpers/paginate');

exports.create = function(inserts,cb){

    var sql = Query.insert(inserts).into('contest');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.getPublic = function(cb){

    async.waterfall([
        function(callback) {
            getRunning(callback);
        },
        function(running,callback){
            getFuture(running,callback);
        },
        function(running,future,callback){
            getEnded(running,future,callback);
        }
    ], function (error,running,future,ended) {
        cb(error,running,future,ended);
    });
};


var getRunning = function(cb){

        var sql = Query.select(['cnts.*'])
         .count('usr.id as users')
         .from('contest as cnts')
         .leftJoin('contest_participants as usr', 'usr.cid', 'cnts.id')
         .where(
         Query.raw('`cnts`.`status` = 2 AND `cnts`.`begin`<=NOW() AND `cnts`.`end` > NOW()')
        )
            .groupBy('cnts.id')
            .orderBy('cnts.begin','desc');


    DB.execute(
        sql.toString()
        ,function(err,rows){
            if(err){ return cb(err); }

            cb(null,rows);
        });
};

var getFuture = function(running,cb){

    var sql = Query.select(['cnts.*'])
        .count('usr.id as users')
        .from('contest as cnts')
        .leftJoin('contest_participants as usr', 'usr.cid', 'cnts.id')
        .where(
        Query.raw('`status` = 2 AND `begin` > NOW()')
    )
        .groupBy('cnts.id')
        .orderBy('cnts.begin');


    DB.execute(
        sql.toString()
        ,function(err,rows){
            if(err){ return cb(err); }

            cb(null,running,rows);
        });
};

var getEnded = function(running,future,cb){

    var sql = Query.select(['cnts.*'])
        .count('usr.id as users')
        .from('contest as cnts')
        .leftJoin('contest_participants as usr', 'usr.cid', 'cnts.id')
        .where(
        Query.raw('`status` = 2 AND `end` <= NOW()')
    )
        .groupBy('cnts.id')
        .orderBy('cnts.begin','desc');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if(err){ return cb(err); }

            cb(null,running,future,rows);
        });
};


exports.getEditable = function(cb){

    var sql = Query.select().from('contest').where(Query.raw('`end` > NOW()'));

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.update = function(inserts,cid,cb){

    var sql = Query('contest').update(inserts)
        .where({ 'id': cid });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.updateProblem = function(inserts,pid,cb){

    var sql = Query('problems').update(inserts)
        .where({
            'id': pid
        });

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};



function getDetails(cid,cb){

    var sql = Query.select().from('contest').where('id', cid).limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
}

exports.getDetails = getDetails;

exports.getProblems = function(cid,cb){

    var sql = Query.select(['contest_problems.pid','contest_problems.pname','problems.title','problems.status'])
        .from('contest_problems')
        .leftJoin('problems', 'contest_problems.pid', 'problems.id')
        .where('contest_problems.cid', cid)
        .as('ignored_alias');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.getDashboardProblems = function(cid,uid,cb){

    var sql;
    if(uid!==-1){
        sql = Query.select([
            'cp.pid','cp.pname',
            'prob.title',
            Query.raw('ifnull(`solved`.`totalsolved`,0) AS `accepted`'),
            Query.raw('ifnull(`usaclj`.`pid`,0) AS `uac`'),
            Query.raw('ifnull(`uswalj`.`pid`,0) AS `uwa`')
        ])
            .from('contest_problems as cp')
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('  left join (SELECT `cs`.`pid`,COUNT(DISTINCT `cs`.`uid`) AS `totalsolved` FROM `contest_submissions` as `cs` WHERE `cs`.`cid`=? AND 	`cs`.`status`=?) as `solved` ON `cp`.`pid` = `solved`.`pid`',[cid,'0'])
            .leftJoin('problems as problemslist', 'cp.pid', 'problemslist.id')
            .where('cp.cid', cid)
            .as('ignored_alias')
            .joinRaw(' left join (SELECT `usac`.`pid` FROM `contest_submissions` as `usac` WHERE `usac`.`cid`=? AND `usac`.`uid`=? AND `usac`.`status`=? LIMIT 1) as `usaclj` ON `cp`.`pid` = `usaclj`.`pid`',[cid,uid,'0'])
            .joinRaw(' left join (SELECT `uswa`.`pid` FROM `contest_submissions` as `uswa` WHERE `uswa`.`cid`=? AND `uswa`.`uid`=? AND NOT `uswa`.`status`=? LIMIT 1) as `uswalj` ON `cp`.`pid` = `uswalj`.`pid`',[cid,uid,'0'])
            .groupBy('cp.pid')
    }else{
        sql = Query.select(['cp.pid','cp.pname','prob.title',Query.raw('ifnull(`solved`.`totalsolved`,0) AS `accepted`')])
            .from('contest_problems as cp')
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('  left join (SELECT `cs`.`pid`,COUNT(DISTINCT `cs`.`uid`) AS `totalsolved` FROM `contest_submissions` as `cs` WHERE `cs`.`cid`=? AND 	`cs`.`status`=?) as `solved` ON `cp`.`pid` = `solved`.`pid`',[cid,'0'])
            .leftJoin('problems as problemslist', 'cp.pid', 'problemslist.id')
            .where('cp.cid', cid)
            .as('ignored_alias')
            .groupBy('cp.pid');
    }

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.getDetailsandProblem = function(cid,pid,cb){

    var sql = Query.select([
        'cn.*','cp.pid','pb.title as probTitle','pb.statement','pb.input','pb.output','pb.score','pb.cpu','pb.memory'
    ])
        .from('contest as cn')
        .joinRaw(' left join `contest_problems` as `cp` ON `cn`.`id` = `cp`.`cid` AND `cp`.`pid` = ?',[pid])
        .leftJoin('problems as pb', 'cp.pid', 'pb.id')
        .where('cn.id', cid)
        .limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.getUserSubmissions = function(cid,pid,uid,cb){

    var sql = Query.select(['status','submittime']).from('contest_submissions').where({
        cid: cid,
        pid: pid,
        uid: uid
    })
        .orderBy('submittime','desc')
        .limit(4);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


exports.isRegistered = function(cid,uid,cb){

    var sql = Query.select(['id']).from('contest_participants').where({
        cid: cid,
        uid: uid
    }).limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.register = function(cid,uid,cb){

    var sql = Query.insert({
        cid: cid,
        uid: uid
    }).into('contest_participants');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.insertProblem = function(cid,pid,cb){

    var sql = Query.insert({
        'cid': cid,
        'pid': pid
    })
        .into('contest_problems');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};



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



exports.UpdateSubmission = function(sid,inserts,cb){

    var sql = Query('contest_submissions').update(inserts).where('id',sid);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};

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

            console.log('moggggggg--------------------------------------------------------');
            console.log(sql.toString());
            console.log('moggggggg--------------------------------------------------------');

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    callback(err,rows);
                });
        }
    ], function (error, rows) {
            cb(error,rows);
    });
};


exports.getRank = function(cid,cb){

    async.waterfall([
        function(callback) {
            getDetails(cid,function(err,rows){
                if(err){ return callback(err); }

                if(!rows.length){ return callback('no contest found'); }

                callback(null,rows[0]);
            });
        },
        function(contest,callback){

            var sql = Query.select([
                'rank.uid',
                'usr.username',
                'usr.username',
                Query.raw("COALESCE(SUM(`rank`.`tried`) * 20,0)  + COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`)),0) AS `penalty`",[contest.begin]),
                Query.raw("COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`"),
                //Query.raw("GROUP_CONCAT( '{ \"pid\":' , `rank`.`pid` , ',\"status\":' , `rank`.`status` , ',\"tried\":' ,`rank`.`tried` , ',\"penalty\":' ,TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) , '}' ORDER BY `rank`.`pid` SEPARATOR '-') as `problems`",[contest.begin]),
                Query.raw("GROUP_CONCAT( '\"' ,`rank`.`pid` , '\":{' , '\"status\":' , `rank`.`status` , ',\"tried\":' , `rank`.`tried` , ',\"penalty\":' , TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ,'}'  ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`",[contest.begin]),
            ])
                .from('contest_rank as rank')
                .leftJoin('users as usr','rank.uid','usr.id')
                .where('rank.cid',cid)
                .groupBy('rank.uid')
                .orderByRaw('`solved` desc,`penalty`');

            console.log(sql.toString());

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    callback(err,rows);
                });
        }
    ], function (error, rank) {


        cb(error,rank);

    });

};




