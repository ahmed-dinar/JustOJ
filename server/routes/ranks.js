'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var isUndefined = require('lodash/isUndefined');
var url = require('url');
var moment = require('moment');
var async = require('async');
var entities = require('entities');
var logger = require('winston');

var MyUtil = require('../lib/myutil');
var Problems = require('../models/problems');
var Paginate = require('../lib/pagination/paginate');
var Query = require('../config/database/knex/query');


/**
 *
 */
router.get('/', function(req, res, next) {

  res.render('ranks', {
    active_nav: 'ranks',
    title: 'JUST Online Judge - Ranks',
    isLoggedIn: req.isAuthenticated(),
    user: req.user
  });
});


/**
 *
 */
router.get('/p/:pid', function(req, res, next) {

  var problemId = req.params.pid;

  if( !MyUtil.isNumeric(problemId) )
    return next(new Error('404'));

  async.waterfall([
    function(callback) {
      Problems.findById(problemId,['title'],function(err,rows){
        if(err)
          return callback(err);

        if(!rows.length)
          return callback('What Are You Looking For?');

        return callback(null,rows[0].title);
      });
    },
    function(pName,callback) {

      var cur_page = req.query.page;

      if( isUndefined(cur_page) || parseInt(cur_page) < 1 )
        cur_page = 1;
      else
                cur_page = parseInt(cur_page);

      var sql = Query.select(['submissions.language','submissions.submittime','submissions.cpu','submissions.memory','users.username'])
                    .from('submissions')
                    .orderBy('submissions.cpu')
                    .leftJoin('users', 'submissions.uid', 'users.id')
                    .min('submissions.cpu as cpu')
                    .groupBy('submissions.uid')
                    .where({
                      'submissions.pid': problemId,
                      'submissions.status': '0'
                    })
                    .as('ignored_alias');

      var sqlCount = Query.min('counted as count').from(function() {
        this.count('* as counted')
          .from('submissions')
          .where({pid: problemId, status: '0'})
          .groupBy('uid')
          .as('c');
      })
                .as('ignored_alias');

      Paginate.paginate({
        cur_page: cur_page,
        sql: sql,
        sqlCount: sqlCount,
        limit: 25,
        url: url.parse(req.originalUrl).pathname
      }, function(err,rows,pagination) {

        if( err )
          return callback(err);

        callback(null,pName,pagination,rows);
      });
    }
  ], function (error, pName, pagination, rank) {

    if( error ){
      logger.error(error);
      return next(new Error(error));
    }

    if( isUndefined(rank) || !rank.length )
      rank = {};

    logger.debug(rank);

    res.render('problem/rank' , {
      active_nav: 'ranks',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      moment: moment,
      rank: rank,
      pName: entities.decodeHTML(pName),
      pid: problemId,
      pagination: isUndefined(pagination) ? {} : pagination
    });
  });
});



module.exports = router;