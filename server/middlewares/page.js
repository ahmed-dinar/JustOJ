'use strict';

var has = require('has');

function pageMiddleware(req, res, next){
  var page = has(req.query, 'page')
    ? parseInt(req.query.page) || 1
    : 1;

  req.page = page;
  return next();
}

module.exports = pageMiddleware;