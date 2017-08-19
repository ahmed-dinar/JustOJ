'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var json2csv = require('json2csv');
var has = require('has');
var isUndefined = require('lodash/isUndefined');
var range = require('lodash/range');
var forEach = require('lodash/forEach');
var moment = require('moment');
var async = require('async');
var path = require('path');
var fs = require('fs');
var Busboy = require('busboy');
var uuid = require('uuid');
var rimraf = require('rimraf');
var url = require('url');
var mkdirp = require('mkdirp');
var logger = require('winston');

var MyUtil = require('../lib/myutil');
var Submission = require('../models/submission');
var isLoggedIn = require('../middlewares/isLoggedIn');
var roles = require('../middlewares/userrole');
var Contest = require('../models/contest');
var ContestSubmit = require('../models/contestSubmit');
var Problems = require('../models/problems');

/**
 *
 */
router.get('/' , function(req, res, next) {

  Contest.getPublic(function(err,running,future,ended){

    if(err){
      logger.error(err);
      return next(new Error(err));
    }

    res.render('contest/contests',{
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      running: running,
      future: future,
      ended: ended,
      moment: moment
    });
  });
});






/**
 *  contest dashboard / problem list
 */
router.get('/:cid', function(req, res, next) {

  var cid = req.params.cid;
  var isAuthenticated = req.isAuthenticated();
  var user = req.user;
  var notStarted = false;

  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err) return callback(err);

        if( !rows || rows.length === 0 ) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(details,callback) {


      if(!isAuthenticated ) return callback(null,details,false); //not resistered

      Contest.isRegistered(cid,user.id,function(err,rows){
        if(err) return callback(err);

        if(rows.length)
          return callback(null,details,true);

        callback(null,details,false);
      });
    },
    function(details,registered,callback) {

      notStarted = moment().isBefore(details.begin);
      if( notStarted ) return callback(null,details,registered);

      var uid = isAuthenticated ? user.id : -1;
      Contest.getDashboardProblems(cid,uid,function(err,rows){
        if(err) return callback(err);

        callback(null,details,registered,rows);
      });
    }
  ], function (error,details,registered,problems) {

    if( error )
      return next(new Error(error));

    logger.debug(details);
    logger.debug('resitered? : ' + registered);
    logger.debug(problems);

    if( notStarted) {
      res.redirect('/contests/' + cid + '/info');
      return;
    }

    res.render('contest/view/dashboard', {
      active_contest_nav: 'problems',
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      errors: req.flash('err'),
      contest: details,
      registered: registered,
      running: !moment().isAfter(details.end),
      moment: moment,
      problems: problems,
      problemDownloadLink: null //TODO: implement download link generator also db
    });
  });
});


/**
 *  contest announcement,info,details
 */
router.get('/:cid/info', function(req, res, next) {

  var cid = req.params.cid;
  var isAuthenticated = req.isAuthenticated();
  var user = req.user;

  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err) return callback(err);

        if( !rows || rows.length === 0 ) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(details,callback) {

      if(!isAuthenticated ) return callback(null,details,false); //not resistered

      Contest.isRegistered(cid,user.id,function(err,rows){
        if(err) return callback(err);

        if(rows.length)
          return callback(null,details,true);

        callback(null,details,false);
      });
    }
  ], function (error,details,registered) {

    if( error )
      return next(new Error(error));

    logger.debug(details);
    logger.debug('resitered? : ' + registered);

    var state = 'ended';
    if( moment().isBefore(details.begin) )
      state = 'scheduled';
    else if( !moment().isAfter(details.end) )
      state = 'running';

    logger.debug(state);

    res.render('contest/view/announcement',{
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      errors: req.flash('err'),
      contest: details,
      registered: registered,
      state: state,
      moment: moment
    });
  });
});




/**
 *  view a specific clarification
 */
router.get('/:cid/clarifications/view/:clid', isLoggedIn(true), function(req, res, next) {

  var cid = req.params.cid;
  var clarificationId = req.params.clid;
  var notStarted = false;

  async.waterfall([
    function(callback) {
      Contest.getDetailsAndProblemList(cid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){
      notStarted = moment().isBefore(contest.begin);
      if( notStarted ) return callback(null,contest);

      Contest.getClarification(cid,clarificationId,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length) return callback('404');

        callback(null,contest,rows[0]);
      });
    }
  ], function (error,contest,clarification) {
    if( error ) return next(new Error(error));

    logger.debug(clarification);

    if( notStarted ){ // not started
      req.flash('err','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    res.render('contest/view/clarifications/view',{
      active_contest_nav: 'clarifications',
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      moment: moment,
      contest: contest,
      clarificationId: clarificationId,
      clarification: clarification
    });
  });
});


/**
 *  Respond a clarification
 */
router.get('/:cid/clarifications/respond/:clid', isLoggedIn(true), roles.is('admin'), function(req, res, next) {

  var cid = req.params.cid;
  var clarificationId = req.params.clid;
  var notStarted = false;

  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err)
          return callback(err);

        if(!rows || !rows.length)
          return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){
      notStarted = moment().isBefore(contest.begin);
      if( notStarted )
        return callback(null,contest);

      Contest.getClarification(cid,clarificationId,function(err,rows){
        if(err)
          return callback(err);

        if(!rows || !rows.length)
          return callback('404');

        callback(null,contest,rows[0]);
      });
    }
  ], function (error,contest,clarification) {
    if( error )
      return next(new Error(error));

    if( notStarted ){ // not started
      req.flash('err','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    logger.debug(clarification);

    res.render('contest/view/clarifications/respond',{
      active_contest_nav: 'clarifications',
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      moment: moment,
      contest: contest,
      err: req.flash('error'),
      clarification: clarification,
      clarificationId: clarificationId
    });
  });
});


/**
 *  request a clarification
 */
router.get('/:cid/clarifications/request', isLoggedIn(true), function(req, res, next) {

  var cid = req.params.cid;
  var user = req.user;
  var usrid = user.id;

  Contest.getDetailsIsReg(cid,usrid,function(err,rows){
    if(err) return next(new Error(err));

    if( !rows || !rows.length ) return next(new Error('404'));

    var contest = rows[0];
    if( moment().isBefore(contest.begin) ){
      req.flash('err','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    if( user.role !== 'admin' && parseInt(contest.isReg) === -1 ){
      req.flash('err','You are not participating in this contest');
      res.redirect('/contests/' + cid);
      return;
    }

    var problems;
    if( !has(contest,'problemList') || contest.problemList === null )
      problems = {};
    else
            problems = JSON.parse('{' + contest.problemList + '}');

    res.render('contest/view/clarifications/request', {
      active_contest_nav: 'clarifications',
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      isLoggedIn: req.isAuthenticated(),
      user: user,
      contest: contest,
      moment: moment,
      problems: problems,
      err: req.flash('err'),
      forEach: forEach
    });
  });
});


/**
 * TODO: add my option
 *  clarification query. all / general / specific problems clarification
 */
router.get('/:cid/clarifications/:q', isLoggedIn(true), function(req, res, next) {

  var cur_page = req.query.page;
  var cid = req.params.cid;
  var isAuthenticated = req.isAuthenticated();
  var user = req.user;
  var uid = req.user.id;
  var qid = req.params.q;


  if( isUndefined(qid) || (qid !== 'all' && qid !== 'general' && qid !== 'my' && !MyUtil.isNumeric(qid)) )
    return next(new Error('404'));


  if( isUndefined(cur_page) )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  if( cur_page<1 )
    return next(new Error('400'));

  var notStarted = false;
  async.waterfall([
    function(callback) {
      Contest.getDetailsAndProblemList(cid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);

            //not started yet
      if( notStarted ) return callback(null,contest);

            // the pagination part will do in that 'Contest.getClarifications()' function
      var URL = url.parse(req.originalUrl).pathname;
      Contest.getClarifications(cid,uid,qid,cur_page,URL,function(err,rows,pagination){
        if(err) return callback(err);

        callback(null,contest,rows,pagination);
      });
    }
  ], function (error,contest,clarifications,pagination) {
    if( error ) return next(new Error(error));

    logger.debug(contest);
    logger.debug('clarifications--' , clarifications);

    if( notStarted ){ // not started
      req.flash('err','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    var problems;
    if( !has(contest,'problemList') || contest.problemList === null )
      problems = {};
    else
            problems = JSON.parse('{' + contest.problemList + '}');


    logger.debug();
    logger.debug('problems: ',problems);

    res.render('contest/view/clarifications/clarifications', {
      active_contest_nav: 'clarifications',
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      isLoggedIn: isAuthenticated,
      user: user,
      moment: moment,
      contest: contest,
      problems: problems,
      forEach: forEach,
      selected: MyUtil.isNumeric(qid) ? parseInt(qid) : qid,
      clarifications: clarifications,
      pagination: isUndefined(pagination) ? {} : pagination
    });
  });
});


/**
 *   submissions of a contest
 */
router.get('/:cid/submissions', isLoggedIn(true), function(req, res, next) {

  var cur_page = req.query.page;
  var cid = req.params.cid;
  var user = req.user;

  if( isUndefined(cur_page) )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  if( cur_page<1 )
    return next(new Error('400'));

  var notStarted = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length){ return callback('404'); }

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted ) return callback(null,contest);

      var URL = url.parse(req.originalUrl).pathname;
      Contest.getSubmissions(cid,cur_page,URL,function(err,rows,pagination) {
        if(err) return callback(err);

        callback(null,contest,rows,pagination);
      });
    }
  ], function (error,contest,rows,pagination) {

    if( error )
      return next(new Error(error));

    if( notStarted )
      return res.redirect('/contests/' + cid);

    res.render('contest/view/submissions', {
      active_contest_nav: 'submissions',
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      user: user,
      moment: moment,
      isLoggedIn: true,
      status: rows,
      contest: contest,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      pagination: isUndefined(pagination) ? {} : pagination
    });
  });
});


/**
 *   submissions of a problem of a contest
 *   TODO: Mixing normal route and json api is very bad! Create separate API?
 */
router.get('/:cid/submission', function(req, res, next) {

  var isJson = req.headers.accept.indexOf('application/json') > -1;

  if( !has(req.query,'username') || !has(req.query,'problem') ){
    if( isJson ){
      res.status(404).json({ status: 'error', error: '404' });
      return;
    }
    return next(new Error('404'));
  }

  var cid = req.params.cid;
  var username = req.query.username;
  var problemId = req.query.problem;

  var notStarted = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length){ return callback('404'); }

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted ) return callback(null,contest);

      Contest.getUserSubmissionByProblem(cid,problemId,username,function(err,rows) {
        if( err ) return callback(err);

        callback(null,contest,rows);
      });
    }
  ], function (error,contest,rows) {

    if( error ) {
      if( isJson ){
        res.json({ status: 'error', error: 'error' });
        return;
      }
      return next(new Error(error));
    }

    if( notStarted ) {
      if( isJson ){
        res.status(400).json({ status: 'error', error: 'Bad Request' });
        return;
      }
      res.redirect('/contests/' + cid);
      return;
    }

    if( isJson ){
      res.json({ status: 'success', data: rows });
      return;
    }

    res.render('contest/view/user_problem_submissions', {
      active_contest_nav: 'submissions',
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      user: req.user,
      moment: moment,
      isLoggedIn: req.isAuthenticated(),
      status: rows,
      contest: contest,
      foruser: username,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      pagination:  { totalPages: function () { return 0; } } //TODO: what is this?!
    });
  });
});


/**
 *  submissions of a contest of current logged in user
 */
router.get('/:cid/submissions/u/:username', isLoggedIn(true), function(req, res, next) {

  var problem = req.query.problem;
  var username = req.params.username;
  var cur_page = req.query.page;
  var cid = req.params.cid;
  var isAuthenticated = req.isAuthenticated();
  var user = req.user;
  var active_contest_nav = 'submissions';

  if( username === 'my' || username === req.user.username ) {
    active_contest_nav = 'submissionsmy';
    username = req.user.username;
  }

  if( isUndefined(cur_page) )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  if( cur_page<1 )
    return next(new Error('400'));

  var notStarted = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid,function(err,rows){
        if(err){ return callback(err); }

        if(!rows || !rows.length){ return callback('404'); }

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted ) return callback(null,contest);

      var URL = url.parse(req.originalUrl).pathname;
      Contest.getUserSubmissions(cid,username,cur_page,URL,function(err,rows,pagination) {
        if( err ) return callback(err);

        callback(null,contest,rows,pagination);
      });
    }
  ], function (error,contest,rows,pagination) {

    if( error ) return next(new Error(error));

    if( notStarted ) {
      res.redirect('/contests/' + cid);
      return;
    }

    if( !rows.length || !rows[0].id )
      rows = [];

    res.render('contest/view/user_submissions', {
      active_contest_nav: active_contest_nav,
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      isLoggedIn: isAuthenticated,
      user: user,
      moment: moment,
      foruser: username,
      status: rows,
      contest: contest,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames(),
      pagination: isUndefined(pagination) ? {} : pagination
    });
  });
});



/**
*
 *
 *
 */
router.get('/:cid/submissions/:sid', isLoggedIn(true), function(req, res, next) {

  var submissionId = req.params.sid;
  var contestId = req.params.cid;

  if( !MyUtil.isNumeric(submissionId) ) return next(new Error('404'));

  var notStarted = true;
  async.waterfall([
    function(callback) {
      Contest.getDetails(contestId,function(err,rows){
        if(err){ return callback(err); }

        if(!rows || !rows.length){ return callback('404'); }

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted ) return callback(null,contest);

      Submission
        .getPublicTestCase({ submissionId: submissionId, contestId: contestId }, function (err,rows) {
          if(err) return callback(err);

          if(rows.length === 0) return callback('404');

          var runs = rows[0];

          if( !has(runs,'cases') || runs.cases === null )
            runs['cases'] = [];
          else
                        runs['cases'] = JSON.parse('[' + runs.cases + ']');

          callback(null,contest, runs);
        });
    }
  ],function (error,contest, runs) {
    if( error ) return next(new Error(error));

    if( notStarted ) {
      res.redirect('/contests/' + contestId);
      return;
    }

    logger.debug(contest);
    logger.debug(runs);

    if( runs.username !== req.user.username ){
      res.end('unauthorized');
      return;
    }

    res.render('contest/view/submission_info', {
      active_contest_nav: 'submissions',
      active_nav: 'contest',
      title: 'Problems | JUST Online Judge',
      locals: req.app.locals,
      submissionId: submissionId,
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      moment: moment,
      contest: contest,
      runs: runs,
      runStatus: MyUtil.runStatus(),
      langNames: MyUtil.langNames()
    });

  });
});


/**
 *  get a specific problem
 */
router.get('/:cid/problem/:pid', function(req, res, next) {

  var cid = req.params.cid;
  var pid = req.params.pid;
  var isAuthenticated = req.isAuthenticated();
  var user = req.user;
  var notStarted = false;

  async.waterfall([
    function(callback) {
      Contest.getDetailsandProblem(cid,pid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length) return callback('404');

        if(rows[0].pid === null) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(details,callback) {  //TODO: this can be merge into getDetailsandProblem???

      notStarted = moment().isBefore(details.begin);
      if(notStarted || !isAuthenticated){ return callback(null,details,false); }

            //TODO: check this out after finalize private contest functionality
            //if(!details.privacy){ return callback(null,details,false); } //for private contest

      Contest.isRegistered(cid,user.id,function(err,rows){
        if(err) return callback(err);

        callback(null,details, (rows.length > 0) );
      });
    },
    function(details,registered,callback) {

      if( notStarted || !registered ) return callback(null,details,registered);

            //TODO: add pagination
      Contest.getUserProblemSubmissions(cid,pid,user.id,function(err,rows){
        if(err) return callback(err);

        callback(null,details,registered,rows);
      });
    }
  ], function (error,contest,registered,submissions) {

    if( error ) return next(new Error(error));

    logger.debug(contest);
    logger.debug('res? : ' + registered);
    logger.debug(submissions);

    if( notStarted )
      return res.redirect('/contests/' + cid);

    if( moment().isAfter(contest.end) ){ //ended

      contest = Problems.decodeToHTML(contest);  //TODO: please recheck this
      return res.render('contest/view/problem',{
        active_contest_nav: 'problems',
        active_nav: 'contest',
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        errors: req.flash('err'),
        formError: req.flash('formError'),
        contest: contest,
        registered: registered,
        running: false,
        moment: moment
      });
    }

        //TODO: can be merge into one insted of checking ended??

    contest = Problems.decodeToHTML(contest); //TODO: please recheck this
    res.render('contest/view/problem',{
      active_contest_nav: 'problems',
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      errors: req.flash('err'),
      formError: req.flash('formError'),
      contest: contest,
      registered: registered,
      running: true,
      moment: moment,
      submissions: submissions,
      runStatus: MyUtil.runStatus()
    });
  });
});


/**
 *  resistration fot a contest, TODO: may in post request????
 */
router.get('/:cid/resister', isLoggedIn(true), function(req, res, next) {

  var cid = req.params.cid;
  var uid = req.user.id;

  async.waterfall([
    function (callback) {
      Contest.getDetailsIsReg(cid,uid,function(err,rows){
        if(err) return callback(err);

        if(!rows || !rows.length) return callback('404');

        callback(null, parseInt(rows[0].isReg) !== -1 );
      });
    },
    function(isReg,callback) {

      if(isReg) return callback();

      Contest.register(cid,uid,function(err,rows){
        if(err) return callback(err);

        callback();
      });
    }
  ], function (error) {
    if( error ) return next(new Error(error));

    res.redirect('/contests/' + cid);
  });
});



/**
 *  get standings of a contest
 */
router.get('/:cid/standings', function(req, res, next) {

  var cid = req.params.cid;
  var cur_page = req.query.page;

  if( isUndefined(cur_page) )
    cur_page = 1;
  else
        cur_page = parseInt(cur_page);

  if( cur_page<1 )
    return next(new Error('what are u looking for!'));

  var URL = url.parse(req.originalUrl).pathname;
  Contest.getRank(cid,cur_page,URL,function(err,contest,problemStats,ranks,pagination){

    if(err) return next(new Error(err));

    logger.debug(contest);
    logger.debug('Begin: ', moment(contest.begin).format('YYYY-MM-DD HH:mm:ss'));
    logger.debug(ranks);
    logger.debug(problemStats);


    res.render('contest/view/standings',{
      active_contest_nav: 'standings',
      active_nav: 'contest',
      isLoggedIn: req.isAuthenticated(),
      user: req.user,
      errors: req.flash('err'),
      contest: contest,
      problemStats: problemStats,
      ranks: ranks,
      running: true,
      moment: moment,
      isUndefined: isUndefined,
      pagination: pagination
    });
  });
});



/**
 *
 */
router.post('/edit/:cid/problems/:pid/step3', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  var cpu = req.body.ftl;
  var memory = req.body.fml;

  if( !cpu || !memory || !MyUtil.isNumeric(cpu) || !MyUtil.isNumeric(memory) ){
    req.flash('error', 'invalid or empty limits, please check again');
    res.redirect('/contests/edit/' + req.params.cid + '/problems/' + req.params.pid + '/step3');
    return;
  }

  if( parseFloat(cpu) < 0.0 || parseFloat(cpu)>5.0 ){
    req.flash('error', 'cpu limit should not be less than zero or greater than 5s');
    res.redirect('/contests/edit/' + req.params.cid + '/problems/' + req.params.pid + '/step3');
    return;
  }

  if( parseInt(memory) < 0.0 || parseInt(memory)>256 ){
    req.flash('error', 'memory limit should not be less than zero or greater than 256mb');
    res.redirect('/contests/edit/' + req.params.cid + '/problems/' + req.params.pid + '/step3');
    return;
  }

  async.waterfall([
    function(callback) {
      Problems.findById(req.params.pid,['id'],function(err,row){

        if( err )
          return callback(err);

        if( !row.length ) return callback('404');

        callback();
      });
    },
    function(callback){
      var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid);
      fs.readdir(rootDir, function(err, files) {

        if( err ){
          if( err.code === 'ENOENT' )
            return callback('noTest','Please add test case first');   //no test cases added yet!

          return callback(err);
        }

        if(!files || files.length === 0)
          return callback('noTest','Please add test case first');

        callback();
      });
    },
    function(callback) {

      var limits = {
        cpu: parseInt(parseFloat(cpu)*1000.0),
        memory: memory,
        status: 'complete'
      };

      Problems.updateLimits(req.params.pid,limits,function(err,row){

        if(err)
          return callback(err);

        callback();
      });
    },
    function(callback) {  //TODO: every time changed status to 1, if 2 also turned into 1, please fixed this

      Contest.update({ status: '1' } , req.params.cid, function (err,rows) {
        if(err)
          return callback(err);

        callback();
      });
    }
  ], function (error, noTest) {

    if( error && !noTest ) {
      logger.error(error);
      return next(new Error(error));
    }

    if (noTest){
      req.flash('noTestCase', 'Please add at least one test case');
      return res.redirect('/contests/edit/'+ req.params.cid +'/problems/'+ req.params.pid +'/step2');
    }

    res.redirect('/contests/edit/'+ req.params.cid);
  });
});


/**
 *
 */
router.post('/edit/:cid/problems/:pid/step1', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  if( !req.body ) { return next(new Error(err)); }

  Problems.updateContestProblem(req, function(err,row){

    if( err ) return next(new Error(err));

    res.redirect('/contests/edit/'+ req.params.cid +'/problems/'+ req.params.pid +'/step2');
  });
});


/**
 *
 */
router.post('/edit/:cid/problems/:pid/step2', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  var uniquename = uuid.v4();
  var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid + '/' + uniquename);
  var namemap = [saveTo + '/i.txt', saveTo + '/o.txt'];

  async.waterfall([
    function(callback) {
      Problems.findById(req.params.pid,['id'],function(err,row){

        if( err )
          return callback(err);

        if( row.length === 0 )
          return callback('404');

        return callback();
      });
    },
    function(callback) {
      mkdirp(saveTo, callback);
    }
  ], function (error) {

    if(error) {
      logger.error(error);
      return next(error);
    }

    var busboy = new Busboy({ headers: req.headers });
    var noFile = 0;
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

      if( noFile || !filename ){
        noFile = 1;
        file.resume();
        return;
      }

      file.pipe(fs.createWriteStream(namemap[fname++]));
    });

    busboy.on('finish', function() {

      if( noFile || fname!==2 ) //clear our created input output files
        return clearUpload( saveTo , req, res );

      req.flash('tcUpSuccess', 'Test Case added!');
      res.redirect('/contests/edit/'+ req.params.cid +'/problems/'+ req.params.pid +'/step2');
    });
    req.pipe(busboy);
  });
});


/**
 *
 */
router.post('/edit/:cid/problems/rtc', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  if( !req.body.pid || !req.body.casename )
    return next(new Error('No Request body found'));

  async.waterfall([
    function(callback) {
      Problems.findById(req.body.pid, ['id'],function(err,row){

        if( err )
          return callback(err);

        if( !row || !row.length )
          return callback('404');

        return callback();
      });
    },
    function(callback) {

      var TCDir = path.normalize(process.cwd() + '/files/tc/p/' + req.body.pid + '/' + req.body.casename);

      logger.debug('tc to remove ' + TCDir);

      rimraf(TCDir, callback);
    }
  ], function (err) {

    if( err ){
      logger.error(err);
      req.flash('tcRemErr','Something wrong');
    }else{
      req.flash('tcRemSuccess', 'Test Case Removed');
    }

    res.redirect('/contests/edit/'+ req.params.cid +'/problems/'+ req.body.pid +'/step2');
  });
});



/**
 * Add a new problem to a contest
 */
router.post('/edit/:cid/problems/new', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  async.waterfall([
    function(callback) {
      Contest.findById(req.params.cid, function (err,rows) {

        if(err)
          return callback(err);

        if( rows.length === 0 )
          return next(new Error('404, no contest found!'));

        return callback();
      });
    },
    function(callback) {
      Problems.insertContestProblem(req, function(err,pid){
        if( err )
          return callback(err);

        return callback(null,pid);
      });
    },
    function(pid,callback){
      Contest.insertProblem(req.params.cid,pid,function(err,rows){
        if( err )
          return callback(err);

        return callback(null,pid);
      });
    }
  ], function (error,pid) {

    if( error ) {
      logger.error(error);
      return next(new Error(error));
    }

    res.redirect('/contests/edit/' + req.params.cid + '/problems/' + pid + '/step2');
  });
});


/**
 *  TODO: check it again
 */
router.post('/edit/detail/:cid', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  var type = req.body.type;
  var title = req.body.title;
  var beginDate = req.body.beginDate;
  var beginTime = req.body.beginTime;
  var lenDay = req.body.lenDay;
  var lenTime = req.body.lenTime;

    /* TODO: OMG! Use validator for god sake! */
  if( isUndefined(type) || isUndefined(title) || isUndefined(beginDate) || isUndefined(beginTime) ||
        isUndefined(lenDay) || isUndefined(lenTime) || !type.length || !title.length || !beginDate.length ||
        !beginTime.length || !lenDay.length || !lenTime.length){

        // debug('type: ' + type + ' title: ' + title + ' beginDate: ' + beginDate);
        // debug('beginTime: ' + beginTime + ' lenDay: ' + lenDay + ' lenTime: ' + lenTime);

    req.flash('err','Invalid or Empty Form');
    res.redirect('/contests/edit/'+req.params.cid);
    return;
  }

  var len = moment(lenTime, 'HH:mm:ss');
  var begin = moment(beginDate + ' ' + beginTime).format('YYYY-MM-DD HH:mm:ss');
  var end = moment(beginDate + ' ' + beginTime).add({
    days: parseInt(lenDay),
    hours: parseInt(len.get('hour')),
    minutes: parseInt(len.get('minute')),
    seconds: parseInt(len.get('second'))
  })
        .format('YYYY-MM-DD HH:mm:ss');

  Contest.update({
    title: title,
    begin: begin,
    end: end,
    privacy: type === 'public' ? 1 : 0
  }, req.params.cid , function(err,rows){

    if(err)
      return next(new Error(err));

    req.flash('success','Updated!');
    res.redirect('/contests/edit/' + req.params.cid);
  });
});



/**
 *  TODO: add cid and pid in form body???
 */
router.post('/:cid/submit/:pid',isLoggedIn(true) , function(req, res, next) {

  var cid = req.params.cid;
  var uid = req.user.id;

  Contest.findAndisRegistered(cid,uid,function (err,rows) {
    if(err) return next(new Error(err));

    if( rows.length === 0 ) return next(new Error('404'));

    if( !rows[0].resistered ) return next(new Error('401'));

    ContestSubmit.submit(req, res, next);
  });
});



/**
 *
 */
router.post('/:cid/clarifications/delete', isLoggedIn(true), roles.is('admin'), function(req, res, next) {

  var cid = req.params.cid;
  var clarid = req.body.clar_id;

  var notStarted = false, isEnded = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid, function(err,rows){
        if(err)
          return callback(err);

        if(!rows.length)
          return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted )
        return callback(null,contest);

      isEnded = moment().isAfter(contest.end);
      if( isEnded )
        return callback(null,contest);

      Contest.deleteClarification(cid, clarid, function (err, rows) {
        if(err)
          return callback(err);

        callback(null,contest);
      });
    }
  ], function (error,contest) {

    if( error )
      return next(new Error(error));

    if( notStarted ){
      req.flash('error','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    if( isEnded ){
      req.flash('error','Contest Ended');
      res.redirect('/contests/' + cid);
      return;
    }

    res.redirect('/contests/' + cid + '/clarifications/all');
  });
});


/**
 *
 */
router.post('/:cid/clarifications/respond', isLoggedIn(true), roles.is('admin'), function(req, res, next) {

  var cid = req.params.cid;
  var clarid = req.body.clar_id;
  var response = req.body.response;
  var ignore = has(req.body,'ignore');

  if( !ignore && (!response || response === '') ){
    req.flash('error','empty response');
    res.redirect('/contests/' + cid + '/clarifications/respond/' + clarid);
    return;
  }

  var notStarted = false, isEnded = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid, function(err,rows){
        if(err)
          return callback(err);

        if(!rows.length)
          return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      notStarted = moment().isBefore(contest.begin);
      if( notStarted )
        return callback(null,contest);

      isEnded = moment().isAfter(contest.end);
      if( isEnded )
        return callback(null,contest);

      var updateObj = ignore
                ? { status: 'ignore' , response: '' }
                : { status: 'accepted' , response: response };
      Contest.updateClarification(cid, clarid, updateObj , function (err,rows) {
        if( err )
          return callback(err);

        callback(null, contest);
      });
    }
  ], function (error,contest) {

    if( error )
      return next(new Error(error));

    if( notStarted ){
      req.flash('error','Contest not started yet');
      res.redirect('/contests/' + cid);
      return;
    }

    if( isEnded ){
      req.flash('error','Contest Ended');
      res.redirect('/contests/' + cid);
      return;
    }

    res.redirect('/contests/' + cid + '/clarifications/all');
  });
});


/**
 * clarification post
 */
router.post('/:cid/clarifications/post',isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

  var problem = req.body.problem;
  var reqText = req.body.request;
  var cid = req.params.cid;

  if( reqText === '' ){
    req.flash('err','empty request');
    res.redirect('/contests/' + cid + '/clarifications/request');
    return;
  }

  var isEnded = false;
  async.waterfall([
    function(callback) {
      Contest.getDetails(cid, function(err,rows){
        if(err)
          return callback(err);

        if(!rows.length)
          return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      isEnded = moment().isAfter(contest.end);
      if( isEnded )
        return callback(null,contest);

      if(problem === 'general')
        problem = 0;

      Contest.insertClarification({
        cid: cid,
        pid: problem,
        uid: req.user.id,
        request: reqText,
        response: 'General',
        status: 'general'
      },function(err,rows){
        if(err)
          return callback(err);

        callback(null,contest);
      });
    }
  ], function (error,contest) {

    if( error )
      return next(new Error(error));

    if( isEnded ){
      req.flash('err','Contest Ended');
      res.redirect('/contests/' + cid);
      return;
    }

    res.redirect('/contests/' + cid + '/clarifications/all');
  });
});




/**
 * clarification request
 */
router.post('/:cid/clarifications/request',isLoggedIn(true) , function(req, res, next) {

  var problem = req.body.problem;
  var reqText = req.body.request;
  var cid = req.params.cid;

  if( reqText === '' ){
    req.flash('err','empty request');
    res.redirect('/contests/' + cid + '/clarifications/request');
    return;
  }

  var notStarted = false, isEnded = false;
  async.waterfall([
    function(callback) {
      Contest.getDetailsIsReg(cid,req.user.id,function(err,rows){
        if(err) return callback(err);

        if(!rows.length) return callback('404');

        callback(null,rows[0]);
      });
    },
    function(contest,callback){

      if( parseInt(contest.isReg) === -1 )
        return callback(null,contest);

      notStarted = moment().isBefore(contest.begin);
      if( notStarted )
        return callback(null,contest);

      isEnded = moment().isAfter(contest.end);
      if( isEnded )
        return callback(null,contest);

      if(problem === 'general')
        problem = 0;

      Contest.insertClarification({
        cid: cid,
        pid: problem,
        uid: req.user.id,
        request: reqText,
        status: ''
      },function(err,rows){
        if(err) return callback(err);

        callback(null,contest);
      });
    }
  ], function (error,contest) {

    if( error )
      return next(new Error(error));

    if( contest.isReg === -1 ){
      req.flash('err','You Are Not Participation in This Contest');
      res.redirect('/contests/' + cid);
      return;
    }

    if( notStarted ){
      res.redirect('/contests/' + cid);
      return;
    }

    if( isEnded ){
      req.flash('err','Contest Ended');
      res.redirect('/contests/' + cid);
      return;
    }

    res.redirect('/contests/' + cid + '/clarifications/all');
  });
});


/**
 *
 * @param remDir
 * @param req
 * @param res
 */
var clearUpload = function(remDir,req,res){

  rimraf(remDir, function(error){
    if( error )
      logger.error(error);
    else
            logger.debug('Cleaned uploaded TC');

    req.flash('tcUpErr', 'Please Select File');
    res.redirect('/contests/edit/'+ req.params.cid +'/problems/'+ req.params.pid +'/step2');
  });
};



module.exports = router;
