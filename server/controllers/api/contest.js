'use strict';


var express = require('express');
var router = express.Router();

var async = require('async');
var logger = require('winston');
var moment = require('moment');


var contest = appRequire('models/contest');
var AppError = appRequire('lib/custom-error');
var Schema = appRequire('config/validator-schema');
var authJwt = appRequire('middlewares/authJwt');
var roles = appRequire('middlewares/roles');
//var authUser = appRequire('middlewares/authUser');


router.get('/',function(req, res, next) {
  res.status(200).json('hello contests api!');
});


router.post('/create', /*authJwt, roles('admin'),*/ function(req, res, next){

  logger.debug(req.body);
  logger.debug(new Date());
  logger.debug(Date.now());

  async.waterfall([
    function(callback){
      req.sanitize('title').escapeInput();
      req.sanitize('description').escapeInput();
      req.checkBody(Schema.contest);
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
    }
  ],
  function(err, rows){
    if(err){
      if(err.name === 'input'){
        return res.status(400).json({ error: err.message });
      }
      return res.sendStatus(500);
    }

    logger.debug( req.body.days );
    logger.debug( moment.duration(req.body.duration).get('hours') );
    logger.debug( moment.duration(req.body.duration).get('minutes') );
    logger.debug( moment.duration(req.body.duration).get('seconds') );

    var data = {
      begin: moment(req.body.when).format('YYYY-MM-DD HH:mm:ss')
      //end: moment(req.body.when).add({ days: 7, months: 1 })
    };

    logger.debug(data);

    return res.sendStatus(200);
  });
});




module.exports = router;

