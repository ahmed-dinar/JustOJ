var express     = require('express');
var user        = require('../models/user');
var router      = express.Router();

var _           = require('lodash');
var url         = require('url');
var entities    = require('entities');

var isLoggedIn  = require('../middlewares/isLoggedIn');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var Submission  = require('../models/submission');
var Paginate    = require('../helpers/paginate');
var moment      = require("moment");
var async       = require('async');


var Query       = require('../config/database/knex/query');


router.get('/' , function(req, res, next) {


    var cur_page = req.query.page;

    if( _.isUndefined(cur_page) ){
        cur_page = 1;
    }else{
        cur_page = parseInt(cur_page);
    }

    if( cur_page<1 ) {
        return callback('what are u looking for!');
    }


    var sql = Query.select(['submissions.status','submissions.language','submissions.submittime','submissions.cpu','submissions.memory','submissions.pid','submissions.id','users.username','problems.title'])
        .from('submissions')
        .orderBy('submissions.submittime', 'desc')
        .leftJoin('users', 'submissions.uid', 'users.id')
        .leftJoin('problems', 'submissions.pid', 'problems.id');

    var sqlCount = Query.count('* as count').from('submissions');


    Paginate.paginate({
            cur_page: cur_page,
            sql: sql,
            limit: 25,
            sqlCount: sqlCount,
            url: url.parse(req.originalUrl).pathname
        },
        function(err,rows,pagination) {

            if( err ){
                console.log(err);
                return next(new Error(err));
            }

            console.log(rows);

            res.render('status/status' , {
                active_nav: "status",
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                moment: moment,
                status: rows,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                pagination: _.isUndefined(pagination) ? {} : pagination,
                decodeToHTML: entities.decodeHTML
            });

        });

});


/**
 *  current user status
 */
router.get('/my' , isLoggedIn(true),  function(req, res, next) {

    var userId = req.user.id;
    var cur_page = req.query.page;

    if( _.isUndefined(cur_page) )
        cur_page = 1;
    else
        cur_page = parseInt(cur_page);


    if( cur_page<1 )
        return callback('401');


    var sql = Query.select(['submissions.status','submissions.language','submissions.submittime','submissions.cpu','submissions.memory','submissions.pid','submissions.id','problems.title'])
        .from('submissions')
        .orderBy('submissions.submittime', 'desc')
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .where('submissions.uid',userId);

    var sqlCount = Query.count('* as count').from('submissions').where('uid',userId);
    Paginate.paginate({
            cur_page: cur_page,
            sql: sql,
            limit: 25,
            sqlCount: sqlCount,
            url: url.parse(req.originalUrl).pathname
        },
        function(err,rows,pagination) {

            if( err )
                return next(new Error(err));

            console.log(rows);


            res.render('status/user_status' , {
                active_nav: "status",
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                moment: moment,
                status: rows,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                pagination: _.isUndefined(pagination) ? {} : pagination,
                decodeToHTML: entities.decodeHTML
            });
        });
});




router.get('/u/:pid' , isLoggedIn(true), function(req, res, next) {

    var uID = req.user.id;
    var pID = req.params.pid;

    if( !MyUtil.isNumeric(pID) ) return next(new Error('What R U looking for?'));

    async.waterfall([
        function(callback) {
            Problems.findById(pID,['title'],function(err,rows){
                if(err){ return callback(err); }
                 if(rows.length===0){ return callback('What Are You Looking For?'); }

                callback(null,rows[0].title);
            });
        },
        function(pName,callback) {

            var cur_page = req.query.page;

            if( _.isUndefined(cur_page) ){
                cur_page = 1;
            }else{
                cur_page = parseInt(cur_page);
            }

            if( cur_page<1 ) {
                return callback('what are u looking for!');
            }


            var sql = Query.select(['language','submittime','cpu','memory','status','id'])
                .from('submissions')
                .orderBy('submittime','desc')
                .where({
                    pid: pID,
                    uid: uID
                });


            var sqlCount = Query.count('* as count').from('submissions')
                .where({
                    pid: pID,
                    uid: uID
                });


            Paginate.paginate({
                    cur_page: cur_page,
                    sql: sql,
                    sqlCount: sqlCount,
                    limit: 25,
                    url: url.parse(req.originalUrl).pathname
                },
                function(err,rows,pagination) {
                    if( err ){ return callback(err); }

                    callback(null,pName,pagination,rows);
                });
            }
    ], function (error, pName, pagination, status) {

        if( error ){ return next(new Error(error)); }


        if( _.isUndefined(status) || status.length === 0 ){
            status = {};
        }

        res.render('status/user_problem_status.ejs' , {
            active_nav: "status",
            title: "Problems | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            runStatus: MyUtil.runStatus(),
            langNames: MyUtil.langNames(),
            moment: moment,
            status: status,
            pName: pName,
            pid: pID,
            pagination: _.isUndefined(pagination) ? {} : pagination,
            decodeToHTML: entities.decodeHTML
        });
    });
});


// justoj.com/status/u/problem/submission
/*
router.get('/u/:pid/:sid' , isLoggedIn(true),  function(req, res, next) {

    var userId = req.user.id;
    var problemId = req.params.pid;
    var submissionId = req.params.sid;

    if( !MyUtil.isNumeric(problemId) ) return next(new Error('What R U looking for?'));

    Submission
        .getTestCase(submissionId,problemId,userId, function (err,rows) {
            if(err) return next(new Error(err));

            if(rows.length === 0) return res.end('Nothing found!');

            var runs = rows[0];

             if( runs.cases === null || _.isUndefined(runs.cases)  )
                runs.cases = [];
             else
                runs.cases = JSON.parse('[' + runs.cases + ']');

            runs.title = entities.decodeHTML(runs.title);

            console.log(runs);

            res.render('status/cases' , {
                active_nav: "status",
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                moment: moment,
                runs: runs,
                submissionId: submissionId
            });
        });
});
*/


/**
 *
 */
router.get('/:sid' ,   function(req, res, next) {

  //  var userId = req.user.id;
    var submissionId = req.params.sid;

    if( !MyUtil.isNumeric(submissionId) ) return next(new Error('What R U looking for?'));

    var opts = {
        submissionId: submissionId
    };

    Submission
        .getPublicTestCase(opts, function (err,rows) {
            if(err) return next(new Error(err));

            if(rows.length === 0) return res.end('Nothing found!');

            var runs = rows[0];

            if( runs.cases === null || _.isUndefined(runs.cases)  )
                runs.cases = [];
            else
                runs.cases = JSON.parse('[' + runs.cases + ']');

            runs.title = entities.decodeHTML(runs.title);

            console.log(runs);



            res.render('status/cases' , {
                active_nav: "status",
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                moment: moment,
                runs: runs,
                submissionId: submissionId
            });
        });

});


module.exports = router;