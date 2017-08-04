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

var testJudgeSolution = require('./problem/judgeSolution');
var AppError = appRequire('lib/custom-error');
var Schema = appRequire('config/validator-schema');
var OK = appRequire('middlewares/OK');
var authJwt = appRequire('middlewares/authJwt');
var roles = appRequire('middlewares/roles');
var authUser = appRequire('middlewares/authUser');
var decodeHash = appRequire('middlewares/decodeHash');

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

    res
      .status(200)
      .json({
        problems: problems,
        pagination: pagination
      });
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

    if( !req.body ){
      return res.status(400).json({ error: 'Request body not found' });
    }

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


//
// send raw test case file
//
router
  .get('/testcase/:pid/:caseId', authJwt(), roles('admin'), decodeHash(true,['id']), function(req, res, next){

    var caseType = req.query.type;
    if( !caseType ){
      return res.status(404).json({ error: 'Invalid Test Case Type' });
    }

    //var problemSlug = req.params.slug;
    var pid = req.body.problem.id;
    var caseId = req.params.caseId;

    logger.debug(caseType);

    var caseName = caseType === 'input' ? 'i.txt' : 'o.txt';
    var caseDir = path.normalize(process.cwd() + '/files/tc/p/' + pid + '/' + caseId + '/' + caseName);

    fs.stat(caseDir, function(err,stats){
      if(err){
        if( err.code === 'ENOENT' ){
          return res.status(404).json({ error: 'No Test Case Found' });
        }

        logger.error(err);
        return res.sendStatus(500);
      }

      if( stats.isFile() ){
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': stats.size
        });
        var readStream = fs.createReadStream(caseDir);
        readStream.pipe(res);
        return;
      }

      res.status(404).json({ error: 'No Test Case Found' });
    });

  });


//
// edit testcases of a problem
//
router
  .route('/edit/testcase/:pid')
  .all(authJwt(), roles('admin'), decodeHash(true, ['id']), OK())
  .get(function(req, res, next){

    var problemId = req.body.problem.id;

    async.waterfall([
      function(callback){
        var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + problemId);
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

    var pid = req.body.problem.id;
    var action = req.query.action;

    //remove the test case
    if( action === 'remove' ){
      if( !req.body.case ){
        return res.status(400).json({ error: 'Test Case Id required' });
      }
      return removeTestCase(pid, req.body.case, res);
    }


    async.waterfall([
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
        var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + pid + '/' + testCaseId);

        mkdirp(saveTo, function (err) {
          if (err){
            return callback(err);
          }

          logger.info(saveTo + ' test case dir created, for problem pid: ' + testCaseId);

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


//
// edit /add limits of a problem
//
router
  .route('/edit/limits/:pid')
  .all(authJwt(), roles('admin'), decodeHash(true, ['id']), OK())
  .get(OK('ok'))
  .post(function(req, res, next){

    if(
      (!has(req.query,'action') || req.query.action !== 'save') &&
      req.headers['content-type'].indexOf('multipart/form-data') > -1
    ){
      return testJudgeSolution(req, res, next);
    }

    var pid = req.body.problem.id;

    async.waterfall([
      function(callback){
        req.checkBody(Schema.problemLimit);
        req
          .getValidationResult()
          .then(function(result) {
            if (!result.isEmpty()){
              var e = result.array()[0];
              logger.debug(result.array());
              return callback(new AppError(e.param + ' ' + e.msg,'input'));
            }
            return callback();
          });
      },
      async.apply(Problems.hasTestCase, pid),
      function(testCases, callback){
        //no test case found
        if( !testCases ){
          return callback(new AppError('No Test Case Found','303'));
        }

        Problems.updateByColumn(pid, {
          cpu: parseInt(parseFloat(req.body.cpu)*1000.0),
          memory: 256,
          status: 'public'
        }, callback);
      }
    ],
    function(err){
      if(err){
        switch(err.name){
          case 'input':
            return res.status(400).json({ error: err.message });
          case '303':
            return res.status(303).json({ error: 'Add Some Test Cases First' });
          default:
            logger.error(err);
            return res.sendStatus(500);
        }
      }
      res.sendStatus(200);
    });
  });



//
//
//
router.get('/rank/:pid', decodeHash(), function(req, res, next) {
  var pid = req.body.problemId;

  Problems.findRank(pid, function(err, rows){
    if( err ){
      logger.error(err);
      return res.sendStatus(500);
    }

    if(!rows || !rows.length){
      return res.status(200).json([]);
    }

    var ranks = rows[0];
    logger.debug(ranks);


    return res.status(200).json([]);
  });
});


//
//
//
router
  .route('/:pid')
  .get(decodeHash(), function(req, res, next) {

    var pid = req.body.problemId;

    Problems.findByIdandTags(pid,function(err, rows){
      if( err ){
        logger.error(err);
        return res.sendStatus(500);
      }

      if(!rows || !rows.length){
        return res.status(404).json({ error: 'No Problem Found' });
      }

      var problem = rows[0];
      logger.debug(problem);
      if(problem.status !== 'public'){
        return res.sendStatus(403);
      }

      problem.title = entities.decodeHTML(problem.title);
      problem.statement = entities.decodeHTML(problem.statement);
      problem.input = entities.decodeHTML(problem.input);
      problem.output = entities.decodeHTML(problem.output);

      return res.status(200).json(problem);
    });
  })
  .post(authJwt(), decodeHash(), require('./problem/submit'));





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


// *
//  *
//  * @param pid
//  * @param uid
//  * @param problem
//  * @param rank
//  * @param cb
 
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


//
// clear temporary uploaded file
//
function clearUpload(remDir, callback){
  rimraf(remDir, function(error){
    if( error )
      logger.error(error);
    else
      logger.debug('Cleaned uploaded TC');

    callback(new AppError('File required','input'));
  });
};



module.exports = router;
