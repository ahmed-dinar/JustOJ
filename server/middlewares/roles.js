'use strict';

var logger = require('winston');

module.exports = function(role){

  return function(req, res, next){

    logger.debug(req.user);

    if(!req.user)
      return res.status(401).json({ err: 'Unauthorized' });

    if( req.user.role !== role )
      return res.status(403).json({ err: 'Access Denied' });

    next();
  };
};