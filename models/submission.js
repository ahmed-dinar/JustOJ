
var _           = require('lodash');
var async       = require('async');
var has         = require('has');
var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');



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


exports.update = function(sid,inserts,cb){

    var sql = Query('submissions').update(inserts).where('id',sid);

    DB.execute(
        sql.toString()
        ,function(err,rows){
            cb(err);
        });
};


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
 *
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
            "SELECT `sc`.`sid`, GROUP_CONCAT('{\"status\":\"',`sc`.`status`, '\",\"cpu\":\"' ,`sc`.`cpu`, '\",\"memory\":\"' ,`sc`.`memory`, '\",\"errortype\":\"' ,`sc`.`errortype` , '\"}' SEPARATOR ',') as `cases` " +
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
 *
 * @param opts
 * @param cb
 */
exports.getPublicTestCase = function(opts,cb){

    var isContest = has(opts,'contestId');
    var subTable = isContest ? 'contest_submissions as sub' : 'submissions as sub';
    var caseTable = isContest ? 'c_submission_case' : 'submission_case';

    var sql = Query.select(['sub.*','prob.title','cas.cases','usr.username'])
        .from(subTable)
        .leftJoin('problems as prob','sub.pid','prob.id')
        .leftJoin('users as usr','sub.uid','usr.id')
        .joinRaw( '  LEFT JOIN( '+
            "SELECT `sc`.`sid`, GROUP_CONCAT('{\"status\":\"',`sc`.`status`, '\",\"cpu\":\"' ,`sc`.`cpu`, '\",\"memory\":\"' ,`sc`.`memory`, '\",\"errortype\":\"' ,`sc`.`errortype` , '\"}' SEPARATOR ',') as `cases` " +
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


    DB.execute(
        sql.toString()
        ,cb);
};