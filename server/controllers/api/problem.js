'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var _ = require('lodash');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var async = require('async');
var entities = require('entities');
//var moment = require('moment');
var path = require('path');
var fs = require('fs');
var Busboy = require('busboy');
var slug = require('slug');
var url = require('url');
var has = require('has');
var crypto = require('crypto');
var logger = require('winston');

//var MyUtil = appRequire('lib/myutil');
var Problems = appRequire('models/problems');
var removeTestCase = require('./problem/removeTestCase');

//var EditProblem = appRequire('edit_problem/editProblem');

var AppError = appRequire('lib/custom-error');
var Schema = appRequire('config/validator-schema');
var OK = appRequire('middlewares/OK');
var authJwt = appRequire('middlewares/authJwt');
var roles = appRequire('middlewares/roles');
var authUser = appRequire('middlewares/authUser');

slug.defaults.mode ='pretty';

/**
 *
 */
router.get('/list', authUser, function(req, res, next) {

  var cur_page;
  if( !has(req.query,'page') || parseInt(req.query.page) < 1 )
    cur_page = 1;
  else
    cur_page = parseInt(req.query.page);

  var URL = url.parse(req.originalUrl).pathname;
  var uid = req.user ? req.user.id : null;


  //TODO:
  //TODO: AGAIN TODO!!:  please please check the query with user id in model, is it horrible when submission table is too huge??
  Problems.findProblems(uid, cur_page, URL, function(error, problems, pagination) {
    if( error ) {
      logger.error('what');
      logger.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    logger.debug(problems);
    logger.debug(pagination);
    logger.debug('isLoggedIn = ', !!uid);
    setTimeout(function(){
      res
        .status(200)
        .json({
          problems: problems,
          pagination: pagination
        });
    }, 3000);

  });
});


//
// create a new problem
//
router
  .route('/create')
  //checking logged in and admin privilege
  .all(authJwt(), roles('admin'), OK())
  //return ok to load front end
  .get(OK('ok'))
  .post(function(req, res, next) {

    if( !req.body )
      return res.status(400).json({ error: 'Request body not found' });

    var titleSlug = slug(req.body.title.replace(/[^a-zA-Z0-9 ]/g, ' '));

    async.waterfall([
      function validateInput(callback){
        req.sanitize('statement').escapeInput();
        req.sanitize('title').escapeInput();
        req.sanitize('author').escapeInput();
        req.sanitize('input').escapeInput();
        req.sanitize('output').escapeInput();
        req.checkBody(Schema.problem);

        logger.debug('validatin inputs..');

        req
          .getValidationResult()
          .then(function(result) {
            if (!result.isEmpty()){
              var e = result.array()[0];
              logger.debug(result.array());
              return callback(new AppError(e.param + ' ' + e.msg,'input'));
            }
            req.body.slug = entities.encodeHTML(titleSlug);
            return callback();
          });
      },
      async.apply(Problems.save, req.body)
    ],
    function(err, hashId){
      if(err){
        if(err.name === 'input')
          return res.status(400).json({ error: err.message });

        logger.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      logger.debug(hashId);

      res.status(200).json({ id: hashId, slug: titleSlug });
    });
  });



router
  .get('/edit/:pid', authJwt(), roles('admin'), function(req, res, next){
    var pid = req.params.pid;
    var isData = true;
    if( has(req.query,'type') && req.query.type === 'auth' ){
      isData = false;
    }
    logger.debug(req.query);
    logger.debug(isData);

    var columns = isData ? null : ['id'];

    Problems.findByHash(pid, columns, function(err, data){
      if(err){
        logger.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if( !data.length ){
        return res.status(404).json({ error: 'No Problem Found' });
      }

      res.status(200).json(data[0]);
    });
  });


router
  .route('/edit/testcase/:hashId')
  .all(authJwt(), roles('admin'), OK())
  .get(function(req, res, next){

    var hashId = req.params.hashId;
    async.waterfall([
      function(callback) {
        Problems.findByHash(hashId, ['id'], function(err,rows){
          if( err ){
            return callback(err);
          }

          if( !rows || !rows.length ){
            return callback(new AppError('No Problem Found','input'));
          }

          callback();
        });
      },
      function(callback){
        var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + hashId);
        fs.readdir(rootDir, function(err, files) {

          if( err ){
            //no test cases added yet!
            if( err.code === 'ENOENT' ){
              return callback(null,[]);
            }

            return callback(err);
          }

          if(files){
            return callback(null, files);
          }

          callback(null,[]);
        });
      }
    ],
    function (error, cases) {
      if( error ) {
        if(error.name === 'input'){
          return res.status(404).json({ error: error.message });
        }

        logger.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      logger.debug(cases);

      var cas = _.map(_.times(cases.length), function(c){
        return { id: c, hash: cases[c] };
      });

      logger.debug(cas);

      res.status(200).json(cas);
    });
  })
  .post(function(req, res, next){

    var hashId = req.params.hashId;
    var action = req.query.action;

    logger.debug(req.body);
    logger.debug(req.headers);
    logger.debug('hashId = ', hashId);
    logger.debug('action = ', action);
    logger.debug('files = ', req.files); //req.files.yourFieldName.meta.path

    //remove the test case
    if( action === 'remove' ){
      if( !req.body.case ){
        return res.status(400).json({ error: 'Test Case Id required' });
      }
      return removeTestCase(hashId, req.body.case, res);
    }


    async.waterfall([
      //validate problem
      function(callback) {
        Problems.findByHash(hashId, ['id'], function(err,rows){
          if( err ){
            return callback(err);
          }

          if( !rows || !rows.length ){
            return callback(new AppError('No Problem Found','404'));
          }

          callback();
        });
      },
      //create unique random id
      function (callback){
        crypto.randomBytes(20, function(err, buf) {
          if(err){
            return callback(err);
          }

          var testCaseId = buf.toString('hex');
          callback(null, testCaseId);
        });
      },
      //create directory of the test case
      function (testCaseId, callback){
        var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + hashId + '/' + testCaseId);

        mkdirp(saveTo, function (err) {
          if (err){
            return callback(err);
          }

          logger.info(saveTo + ' test case dir created, for problem hashId: ' + testCaseId);

          callback(null, saveTo, testCaseId);
        });
      },
      //save test case
      function (saveTo, testCaseId, callback){
        //init file upload handler
        var busboy = new Busboy({ headers: req.headers });
        //[0] = input file path, [1] = output file path
        var namemap = [saveTo + '/i.txt', saveTo + '/o.txt'];
        //
        var noFile = 0;
        //index of namemap
        var fname = 0;

        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          //I have no idea why i was doing this!
          if( noFile || !filename ){
            noFile = 1;
            file.resume();
            return;
          }

          file.pipe(fs.createWriteStream(namemap[fname++]));
        });

        busboy.on('finish', function() {
          //at lest 2 files should uploaded
          if( noFile || fname!==2 ){
            return clearUpload(saveTo, callback);
          }

          return callback(null, testCaseId);
        });

        req.pipe(busboy);
      }
    ],
    function(err, testCaseId){
      if(err){
        if(err.name === '404'){
          return res.status(404).json({ error: err.message });
        }

        if(err.name === 'input'){
          return res.status(400).json({ error: err.message });
        }

        logger.error(err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    });
  });


function clearUpload(remDir, callback){
  rimraf(remDir, function(error){
    if( error )
      logger.error(error);
    else
      logger.debug('Cleaned uploaded TC');

    callback(new AppError('File required','input'));
  });
};


// /**
//  *
//  */
// router.post('/languages/template/:languageIndex', function(req, res, next) {

//   var languageIndex = parseInt(req.params.languageIndex);

//   var resObj = {
//     status: 'success',
//     template: ''
//   };

//   if( !MyUtil.isNumeric(languageIndex) )
//     resObj.status = 'error';
//   else{
//     resObj.template = MyUtil.langTemplates(languageIndex);
//     if( resObj.template === 'error' )
//       resObj.status = 'error';
//   }

//   res.json(resObj);
//   res.end();
// });


// /**
//  * First step of editing a problem
//  */
// router.get('/edit/:pid/1', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step1Get(req,res,next);
// });


// /**
//  * Second step of editing a problem
//  */
// router.get('/edit/:pid/2', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step2Get(req, res, next);
// });



// /**
//  * Third and final step of editing a problem
//  */
// router.get('/edit/:pid/3', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step3Get(req,res,next);
// });





// /**
//  * rtc = remove test case
//  */
// router.post('/rtc/', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.removeTestCase(req,res,next);
// });


// /**
//  *
//  */
// router.post('/edit/:pid/1', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step1Post(req, res, next);
// });


// /**
//  *
//  */
// router.post('/edit/:pid/2', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step2Post(req, res, next);
// });


// /**
//  *
//  */
// router.post('/edit/:pid/3', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.step3Post(req, res, next);
// });


// /**
//  * tjs = Test Judge Solution, as well as set limits
//  */
// router.post('/edit/:pid/tjs', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
//   EditProblem.testJudgeSolution(req, res, next);
// });


// /**
//  *
//  */
// router.get('/submit/:pid', isLoggedIn(true) , function(req, res, next) {

//   var problemId = req.params.pid;

//   Problems.findById(problemId,['id','title'], function (err,rows) {

//     if(err) {
//       logger.error(err);
//       return nex(new Error(err));
//     }

//     if( !rows || rows.length === 0 )
//       return next(new Error('404'));

//     logger.debug(rows);

//     res.render('problem/submit' , {
//       active_nav: 'problems',
//       title: 'Problems | JUST Online Judge',
//       locals: req.app.locals,
//       isLoggedIn: req.isAuthenticated(),
//       user: req.user,
//       problem: rows[0],
//       moment: moment,
//       formError: req.flash('formError'),
//       error: req.flash('err')
//     });
//   });
// });


// /**
//  *
//  */
// router.get('/:pid', function(req, res, next) {
//   var pid = getPID(req.params.pid);

//   if( !pid )
//     return next(new Error('Invalid problem?'));

//   async.waterfall([
//     function(callback) {
//       findProblem(pid,callback);
//     },
//     function(problem,callback){    //TODO: use left join insted of separte query
//       findRank(pid,problem,callback);
//     },
//     function(problem,rank,callback){  //TODO: may be left join??

//       if( !req.isAuthenticated() )
//         return callback(null,problem,rank,{});

//       return findUserSubmissions(pid,req.user.id,problem,rank,callback);
//     }
//   ], function (error, problem, rank, userSubmissions) {

//     if( error && !problem ){
//       logger.error(error);
//       return next(new Error(error));
//     }

//     logger.debug('problem: ', problem);
//     logger.debug('rank: ', rank);
//     logger.debug('userSubmissions: ', userSubmissions);

//     if( problem.length === 0 ){
//       res.status(404);
//       return next(new Error('404 No problem found!'));
//     }

//     if( problem[0].status !== 'public' ){
//       res.status(403);
//       return next(new Error('403 problem not found!'));
//     }

//     var tags = split(problem[0].tags, ',', 20);
//     tags = (tags[0]==='') ? [] : tags;

//     logger.debug('tags: ', tags);

//     res.render('problem/view' , {
//       active_nav: 'problems',
//       title: 'Problems | JUST Online Judge',
//       locals: req.app.locals,
//       isLoggedIn: req.isAuthenticated(),
//       user: req.user,
//       problem: problem[0],
//       decodeToHTML: entities.decodeHTML,
//       rank: rank,
//       tags: tags,
//       userSubmissions: userSubmissions,
//       tagName: MyUtil.tagNames(),
//       runStatus: MyUtil.runStatus(true),
//       moment: moment,
//       formError: req.flash('formError')
//     });
//   });
// });



// /**
//  * Find a Problem with tags
//  * @param pid
//  * @param cb
//  */
// var findProblem = function(pid,cb){
//   Problems.findByIdandTags(pid,function(err,rows){

//     if( err )
//       return cb(err);

//     if( !rows || rows.length == 0 )
//       return cb('problem row lenght 0!',[]);

//     return cb(null,rows);
//   });
// };


// /**
//  *
//  * @param pid
//  * @param problem
//  * @param cb
//  */
// var findRank = function(pid,problem,cb){
//   Problems.findRank(pid,function(err,rows){

//     if( err )
//       return cb(err);

//     if( isUndefined(rows) || rows.length === 0 )
//       return cb(null,problem,{});

//     return cb(null,problem,rows);
//   });
// };


// /**
//  *
//  * @param pid
//  * @param uid
//  * @param problem
//  * @param rank
//  * @param cb
//  */
// var findUserSubmissions = function(pid,uid,problem,rank,cb){

//   Problems.findUserSubmissions(pid,uid,function(err,rows){
//     if( err )
//       return cb(err);

//     if( isUndefined(rows) || rows.length === 0 )
//       return cb(null,problem,rank,{});

//     return cb(null,problem,rank,rows);
//   });
// };





// /**
//  * BAD! Very BAD! use string library!!
//  * Decode the JOP0 formated problem code
//  * @param pid
//  * @returns {*}
//  */
// function getPID(pid){
//   if( isString(pid) ){
//     var h = '',i;
//     for( i=0; i<pid.length; i++){
//       var ch = pid.charAt(i);
//       if( ch === '0' ){
//         break;
//       }
//       h += ch;
//     }

//     if( h === 'JOP' ){
//       h = '';
//       for(i=i+1; i<pid.length; i++){
//         h += pid.charAt(i);
//       }
//       return h;
//     }
//   }
//   return null;
// }




module.exports = router;