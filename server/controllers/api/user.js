'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();
var has = require('has');
var config = require('nconf');
var logger = require('winston');

var User = appRequire('models/user');


router.post('/available',function(req, res, next) {

  if( !req.body.data )
    return res.status(200).json({ available: false });

  User.available(req.body.data, req.body.data, function(err, rows){
    if(err){
      logger.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if(rows && rows.length)
      return res.status(200).json({ available: false });

    return res.status(200).json({ available: true });
  });
});



router.get('/verify',function(req, res, next) {

  var thishost = config.get('HOST');
  var requestedhost = req.protocol + '://' + req.get('host');

  if( thishost !== requestedhost || !has(req.query,'verification') || !req.query.verification )
    return res.status(400).json({ error: 'Bad Request' });

  User.verify(req.query.verification, function(err, verified){
    if(err){
      logger.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(200).json({ verified: verified });
  });
});



module.exports = router;

