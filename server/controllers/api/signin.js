'use strict';

/**
* Module dependencies.
*/
var express = require('express');
var router = express.Router();
var logger = require('winston');

var User = appRequire('models/user');


router.post('/',function(req, res, next) {

  var username = req.body.username || '';
  var password = req.body.password || '';

  User.auth(username, password, function (err, payLoad){
    if(err){
      if( err.name === '404' || err.name === '401' )
        return res.status(401).json({ error: 'username or password is invalid' });

      logger.error(err);

      return res.status(500).json({ error: 'Internal Server Error' });
    }

    logger.debug(payLoad);

    res.status(200).json(payLoad);
  });

});


module.exports = router;

