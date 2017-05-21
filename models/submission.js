'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');
var async = require('async');
var has = require('has');

var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');
var Paginate = require('../lib/pagination/paginate');


/**
 *  Insert a submission
 * @param inserts
 * @param cb
 */
exports.insert = function(inserts,cb){

    var sql = Query.insert(inserts)
        .into('submissions');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            if( err ) return cb(err);

            cb(null,rows.insertId);
        });
};


/**
 * Update a submission
 * @param sid
 * @param inserts
 * @param cb
 */
exports.update = function(sid,inserts,cb){

    var sql = Query('submissions').update(inserts).where('id',sid);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};


/**
 * Add test case status of a submission
 * @param inserts
 * @param cb
 */
exports.addTestCase = function(inserts,cb){
    var sql = Query.insert(inserts)
        .into('submission_case');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};


/**
 * Insert submitted code
 * @param inserts
 * @param cb
 */
exports.insertCode = function(inserts,cb){
    var sql = Query.insert(inserts)
        .into('submission_code');

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};


/**
 * Get individual test case status of a submission
 * @param submissionId
 * @param problemId
 * @param userId
 * @param cb
 */
exports.getTestCase = function(submissionId,problemId,userId,cb){

    var sql = Query.select(['sub.*','prob.title','cas.cases'])
        .from('submissions as sub')
        .joinRaw('  LEFT JOIN('+
            'SELECT `p`.`title`,`p`.`id` as `ppid` '+
            'FROM `problems` as `p` '+
            'WHERE `p`.`id` = ? '+
            ') AS `prob` ON `sub`.`pid` = `prob`.`ppid`'
            ,[problemId]
        )
        .joinRaw( '  LEFT JOIN( '+
            'SELECT `sc`.`sid`, GROUP_CONCAT(\'{"status":"\',`sc`.`status`, \'","cpu":"\' ,`sc`.`cpu`, \'","memory":"\' ,`sc`.`memory`, \'","errortype":"\' ,`sc`.`errortype` , \'"}\' SEPARATOR \',\') as `cases` ' +
            'FROM `submission_case` as `sc` '+
            'WHERE `sc`.`sid` = ? '+
            'GROUP BY `sc`.`sid` ) AS `cas` ON `sub`.`id` = `cas`.`sid` '
            ,[submissionId]
        )
        .where({
            'sub.id': submissionId,
            'sub.pid': problemId,
            'sub.uid': userId
        })
        .limit(1);


    DB.execute(
        sql.toString()
        ,cb);
};


/**
 * Get test case status to show of a specific submission
 * @param opts
 * @param cb
 */
exports.getPublicTestCase = function(opts,cb){

    var isContest = has(opts,'contestId');
    var subTable = isContest ? 'contest_submissions as sub' : 'submissions as sub';
    var caseTable = isContest ? 'c_submission_case' : 'submission_case';
    var codeTable = isContest ? 'c_submission_code' : 'submission_code';

    var sql = Query.select(['sub.*','prob.title','cas.cases','usr.username','subcode.code'])
        .from(subTable)
        .leftJoin('problems as prob','sub.pid','prob.id')
        .leftJoin('users as usr','sub.uid','usr.id')
        .joinRaw(' LEFT JOIN ?? as subcode ON sub.id = subcode.sid ',[codeTable])
        .joinRaw( '  LEFT JOIN( '+
            'SELECT `sc`.`sid`, GROUP_CONCAT(\'{"status":"\',`sc`.`status`, \'","cpu":"\' ,`sc`.`cpu`, \'","memory":"\' ,`sc`.`memory`, \'","errortype":"\' ,`sc`.`errortype` , \'"}\' SEPARATOR \',\') as `cases` ' +
            'FROM ?? as `sc` '+
            'WHERE `sc`.`sid` = ? '+
            'GROUP BY `sc`.`sid` ) AS `cas` ON `sub`.`id` = `cas`.`sid` '
            ,[caseTable,opts.submissionId]
        );

    if( isContest ){
        sql = sql
            .where({
                'sub.id': opts.submissionId,
                'sub.cid': opts.contestId
            })
            .limit(1);
    }
    else {
        sql = sql
            .where({
                'sub.id': opts.submissionId
            })
            .limit(1);
    }

    DB.execute(sql.toString(),cb);
};


/**
 * Get a specific user submissions
 * @param username
 * @param cur_page
 * @param URL
 */
exports.getUserSubmissions = function (username, cur_page, URL, cb) {

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
        .leftJoin('submissions', 'user.id', 'submissions.uid')
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .where({
            'user.username': username
        }).orderBy('submissions.submittime', 'desc');

    var sqlCount = Query.count('submissions.id as count')
        .from('users as user')
        .leftJoin('submissions', 'user.id', 'submissions.uid')
        .where({
            'user.username': username
        });

    Paginate.paginate({
        cur_page: cur_page,
        sql: sql,
        sqlCount: sqlCount,
        limit: 30,
        url: URL
    }, cb);
};


/**
 * Get a specific user submission of a specific problem
 * @param username
 * @param problemId
 * @param cur_page
 * @param URL
 * @param cb
 */
exports.getUserProblemSubmissions = function (username, problemId, cur_page, URL, cb) {

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
        .joinRaw(' LEFT JOIN submissions ON user.id = submissions.uid AND submissions.pid = ? ',[problemId])
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .where({
            'user.username': username
        }).orderBy('submissions.submittime', 'desc');

    var sqlCount = Query.count('submissions.id as count')
        .from('users as user')
        .joinRaw(' LEFT JOIN submissions ON user.id = submissions.uid AND submissions.pid = ? ',[problemId])
        .where({
            'user.username': username
        });

    Paginate.paginate({
        cur_page: cur_page,
        sql: sql,
        sqlCount: sqlCount,
        limit: 30,
        url: URL
    }, cb);
};