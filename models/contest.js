var _           = require('lodash');
var async       = require('async');

var moment      = require("moment");

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');
var Paginate    = require('../helpers/paginate');
var MyUtil      = require('../helpers/myutil');


/**
 *
 * @param cid
 * @param cb
 */
exports.findById = function(cid,cb){
    var sql = Query
                .select(['id']).from('contest').where({ 'id': cid }).limit(1);

    DB.execute( sql.toString(), cb);
};



/**
 *
 * @param inserts
 * @param cb
 */
exports.create = function(inserts,cb){
    var sql = Query.insert(inserts).into('contest');
    DB.execute( sql.toString(), cb);
};


/**
 *
 * @param cb
 */
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


/**
 *  Get running contest list [pagination not yet added]
 * @param cb
 */
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


/**
 * Get scheduled contest list [pagination not yet added]
 * @param running
 * @param cb
 */
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


/**
 * Get past contest list [pagination not yet added]
 * @param running
 * @param future
 * @param cb
 */
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


/**
 * Get contest that is still running or not yet started for edit by admin/moderator
 *  [should change the logic, make it more dynamic]
 * @param cb
 */
exports.getEditable = function(cb){

    var sql = Query.select().from('contest').where(Query.raw('`end` > NOW()'));

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


/**
 * Update contest information
 * @param inserts
 * @param cid
 * @param cb
 */
exports.update = function(inserts,cid,cb){

    var sql = Query('contest').update(inserts)
        .where({ 'id': cid });

    DB.execute(sql.toString(),cb);
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


/**
 * Get details of a specific contest
 * @param cid
 * @param cb
 */
function getDetails(cid,cb){

    var sql = Query.select().from('contest').where('id', cid).limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
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
             Query.raw("GROUP_CONCAT( '\"' , `list`.`pid` , '\":{' , '\"pid\":' , `list`.`pid` , ',\"name\":' ,`list`.`pname` , ',\"title\":\"' , `list`.`title` , '\"}' ORDER BY `list`.`pname` SEPARATOR ',' ) as `problemList`")
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
            Query.raw("GROUP_CONCAT( '\"' , `list`.`pid` , '\":{' , '\"pid\":' , `list`.`pid` , ',\"name\":' ,`list`.`pname` , ',\"title\":\"' , `list`.`title` , '\"}' ORDER BY `list`.`pname` SEPARATOR ',' ) as `problemList`")
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


/**
 * Get details of a specific contest also all problems of this contest
 * @param cid
 * @param cb
 */
exports.getDetailsAndProblemList = function(cid,cb){

    var sql = Query.select([
        'c.*',
        Query.raw("GROUP_CONCAT( '\"' , `list`.`pid` , '\":{' , '\"pid\":' , `list`.`pid` , ',\"name\":' ,`list`.`pname` , ',\"title\":\"' , `list`.`title` , '\"}' ORDER BY `list`.`pname` SEPARATOR ',' ) as `problemList`")
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });

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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


/**
 * Get problem list of a specific contest including statictis of problems
 * @param cid
 * @param uid
 * @param cb
 */
exports.getDashboardProblems = function(cid,uid,cb){

    var sql;
    if(uid!==-1){ //if user logged in

        sql = Query.select([
            'cp.pid','cp.pname',
            'prob.title',
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
            'cp.pid',
            'cp.pname',
            'prob.title',
            Query.raw('COUNT(DISTINCT `solved`.`uac`) as `accepted`')
        ])
            .from('contest_problems as cp')
            .leftJoin('problems as prob', 'cp.pid', 'prob.id')
            .joinRaw('left join (SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac` FROM `contest_rank` as `cr` WHERE `cr`.`cid` =? AND `cr`.`status`=0) as `solved` ON `cp`.`pid` = `solved`.`ppid`',[cid])
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};


/**
 * Get a user submission history of a contest
 * @param cid
 * @param pid
 * @param uid
 * @param cb
 */
exports.getUserSubmissions = function(cid,pid,uid,cb){

    var sql = Query.select(['status','submittime','language']).from('contest_submissions').where({
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
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
 *
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
            Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`'),
            Query.raw('ifnull(`wa`.`tried`,0) as `triedBy`')
        ]).joinRaw('  LEFT JOIN( ' +
                        'SELECT COUNT(DISTINCT `cs2`.`uid`) as `tried`,`cs2`.`pid` ' +
                        'FROM `contest_submissions` as `cs2` ' +
                        'WHERE `cs2`.`cid`=? ' +
                        'GROUP BY `cs2`.`pid` ' +
                     ') as `wa` on `cp`.`pid` = `wa`.`pid`',[cid]);
    }else{
        sql = Query.select([
            'cp.pid',
            Query.raw('ifnull(`ac`.`solved`,0) as `solvedBy`')
        ]);
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

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
}


/**
 *
 * @param cid
 * @param cur_page
 * @param url
 * @param cb
 */
exports.getRank = function(cid,cur_page,url,cb){

    async.waterfall([
        function(callback) {
            getDetails(cid,function(err,rows){
                if(err){ return callback(err); }

                if(!rows.length){ return callback('no contest found'); }

                callback(null,rows[0]);
            });
        },
        function(contest,callback){

            getProblemStats(cid,true,function(err,rows){

                if(err){ return callback(err); }

                callback(null,contest,rows);

            });

        },
        function(contest,problemStats,callback){


            var sqlInner = Query.select([
                'rank.uid as ruid',
                Query.raw("SUM(CASE WHEN `rank`.`status`=0 THEN ifnull(`rank`.`tried`,1)-1 ELSE 0 END) * 20 + ifnull(SUM(CASE WHEN `rank`.`status`=0 THEN TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ELSE 0 END),0) AS `penalty`",[contest.begin]),
                Query.raw("COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`"),
                Query.raw("GROUP_CONCAT( '\"' ,`rank`.`pid` , '\":{' , '\"status\":' , `rank`.`status` , ',\"tried\":' , `rank`.`tried` , ',\"penalty\":' , TIMESTAMPDIFF(MINUTE, ?, `rank`.`penalty`) ,'}'  ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`",[contest.begin]),
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
                    limit: 5,
                    url: url
                },
                function(err,rows,pagination) {
                    callback(err,contest,problemStats,rows,pagination);
                });

        }
    ], function (error,contest,problemStats,rank,pagination) {
        cb(error,contest,problemStats,rank,pagination);
    });

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
        'cu.username',
        Query.raw("ifnull(`pp`.`title`,'') as `title`"),
        Query.raw("ifnull(`cp`.`pname`,'General') as `pname`")
    ])
        .from('contest_clarifications as cc')
        .leftJoin('users as cu','cc.uid','cu.id')
        .leftJoin('problems as pp', 'cc.pid', 'pp.id')
        .leftJoin('contest_problems as cp', 'cc.pid', 'cp.pid')
        .where({
            'cc.id': clid,
            'cc.cid': cid
        }).limit(1);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};

exports.getClarifications = function(cid,qid,cur_page,url,cb){

    var sql = Query.select([
        'cc.id',
        'cc.request',
        'cc.response',
        Query.raw("ifnull(`pp`.`title`,'') as `title`"),
        Query.raw("ifnull(`cp`.`pname`,'General') as `pname`")
    ])
        .from('contest_clarifications as cc')
        .leftJoin('problems as pp', 'cc.pid', 'pp.id')
        .leftJoin('contest_problems as cp', 'cc.pid', 'cp.pid');


    if( MyUtil.isNumeric(qid)  ){
        sql = sql.where({
            'cc.cid': cid,
            'cc.pid': qid
        });
    }else if( qid === 'general' ){
        sql = sql.where({
            'cc.cid':cid,
            'cc.pid': 0
    });
    }else{
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
        },
        function(err,rows,pagination) {
            cb(err,rows,pagination);
        });
};

exports.insertClarification = function (inserts,cb){

    var sql = Query.insert(inserts).into('contest_clarifications');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err,rows);
        });
};
