'use strict';

var express = require('express');
var router = express.Router();

var _ = require('lodash');
var has = require('has');
var logger = require('winston');
var config = require('nconf');
var Hashids = require('hashids');
var entities = require('entities');

var Submission = appRequire('models/submission');
var getPage = appRequire('middlewares/page');

var problemHash = new Hashids(config.get('HASHID:PROBLEM'), 11);
var subHash = new Hashids(config.get('HASHID:SUB'), 11);

router.get('/', getPage, function(req, res, next) {

  logger.debug('page = ' + req.page);
  logger.debug('query = ', req.query);

  var where = {};
  //for user submissions
  if( has(req.query,'user') ){
    where['users.username'] = req.query.user;
  }
  //for problem submissions
  if( has(req.query,'problem') ){
    var pid = problemHash.decode(req.query.problem);
    //invalid problem hash
    if(!pid || pid === undefined || !pid.length){
      return res.status(404).json({ error: 'No Problem Found' });
    }
    where['submissions.pid'] = pid[0];
  }

  logger.debug('where = ', where);

  Submission.find(req.page, where, 35, function(err, rows, pagination){
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }

    logger.debug(rows);
    logger.debug(pagination);

    //make hash from ids
    _.forEach(rows, function(sub, indx){
      rows[indx].pid = problemHash.encode(sub.pid);
      rows[indx].id = subHash.encode(sub.id);
    });

    res
      .status(200)
      .json({
        submissions: rows,
        pagination: pagination
      });
  });
});



router.get('/:sid', function(req, res, next) {

  var submissionId = subHash.decode(req.params.sid);
  //invalid submission hash
  if(!submissionId || submissionId === undefined || !submissionId.length){
    return res.status(404).json({ error: 'No Submission Found' });
  }

  Submission.getPublicTestCase({ submissionId: submissionId[0] }, function (err, runs) {
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }

    if(!runs.length){
      return res.status(404).json({ error: 'No Submission Found' });
    }

    logger.debug(runs[0]);

    runs = runs[0];
    runs.pid = problemHash.encode(runs.pid);
    runs.id = req.params.sid;
    runs.title = entities.decodeHTML(runs.title);
    runs.code = entities.decodeHTML(runs.code);
    runs.cases = ( !runs.cases || runs.cases === undefined )
      ? []
      : JSON.parse('[' + runs.cases + ']');
    delete runs.uid;

    logger.debug(runs);

    res
      .status(200)
      .json(runs);
  });
});


module.exports = router;