'use strict';

var jwt = require('jsonwebtoken');
var has = require('has');
var config = require('nconf');
var logger = require('winston');

module.exports = function(req, res, next){

  logger.debug('access_token = ', req.cookies.access_token);

  if( !has(req.cookies,'access_token') )
    return next();

  jwt.verify(
    req.cookies.access_token,
    config.get('jwt:secret'),
    { issuer: 'https://justoj.com/api/' },
    function(err, user) {
      if (err) {
        logger.debug(err);
        return next();
      }

      req.user = user;
      next();
    });
};