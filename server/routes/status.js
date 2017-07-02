'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var moment = require('moment');
var async = require('async');
var _ = require('lodash');
var url = require('url');
var entities = require('entities');
var logger = require('winston');

var isLoggedIn = require('../middlewares/isLoggedIn');
var MyUtil = require('../lib/myutil');
var Problems = require('../models/problems');
var Submission = require('../models/submission');
var Paginate = require('../lib/pagination/paginate');
var User = require('../models/user');
var Query = require('../config/database/knex/query');


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
            logger.debug(err);
            return next(new Error(err));
          }

          logger.debug(rows);

          res.render('status/status' , {
            active_nav: 'status',
            title: 'Problems | JUST Online Judge',
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
 * user submission status
 */
router.get('/u/:username' , isLoggedIn(true), function(req, res, next) {

  var username = req.params.username;
  var cur_page = req.query.page;

  if( _.isUndefined(cur_page) || parseInt(cur_page) < 1 )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  async.waterfall([
    function (callback) {
      User.available(username, null, function (err,rows) {
        if(err) return callback(err);

        if(!rows || rows.length === 0) return callback('404');

        callback();
      });
    },
    function (callback) {
      var URL = url.parse(req.originalUrl).pathname;
      Submission.getUserSubmissions(username, cur_page, URL, callback);
    }
  ] ,function (err, rows, pagination) {
    if( err ) return next(new Error(err));

    logger.debug(rows);

    if( rows.length && rows[0].id === null )
      rows = [];

    res.render('status/status' , {
      active_nav: 'status',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      moment: moment,
      status: rows,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      pagination: _.isUndefined(pagination) ? {} : pagination
    });
  });
});



router.get('/u/:username/p/:pid' , isLoggedIn(true), function(req, res, next) {

  var username = req.params.username;
  var problemId = req.params.pid;
  var cur_page = req.query.page;

  if( _.isUndefined(cur_page) || parseInt(cur_page) < 1 )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  async.waterfall([
    function (callback) {
      User.available(username, null, function (err,rows) {
        if(err) return callback(err);

        if(!rows || rows.length === 0) return callback('404 no such user');

        callback();
      });
    },
    function(callback) {
      Problems.findById(problemId,['title'],function(err,rows){
        if(err) return callback(err);

        if(rows.length===0) return callback('404 no such problem');

        callback();
      });
    },
    function(callback) {
      var URL = url.parse(req.originalUrl).pathname;
      Submission.getUserProblemSubmissions(username,problemId,cur_page, URL, callback);
    }

  ], function (err, rows, pagination) {
    if( err ) return next(new Error(err));

    logger.debug(rows);

    if( rows.length && rows[0].id === null )
      rows = [];

    res.render('status/status' , {
      active_nav: 'status',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      moment: moment,
      status: rows,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      pagination: _.isUndefined(pagination) ? {} : pagination
    });
  });
});



/**
 *
 */
router.get('/:sid' , function(req, res, next) {

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

      if( runs.cases === null || _.isUndefined(runs.cases) )
        runs.cases = [];
      else
                runs.cases = JSON.parse('[' + runs.cases + ']');

      runs.title = entities.decodeHTML(runs.title);

      logger.debug(runs);

      res.render('status/cases' , {
        active_nav: 'status',
        title: 'Problems | JUST Online Judge',
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