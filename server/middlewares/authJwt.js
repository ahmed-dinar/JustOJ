'use strict';

var jwt = require('express-jwt');
var config = require('nconf');
var has = require('has');

var jwtMiddleware = jwt({
  secret: config.get('jwt:secret'),
  issuer: 'https://justoj.com/api/',
  getToken: fromHeader
});

//
// extract jwt from header
//
function fromHeader(req) {
  if( !has(req.cookies,'access_token') )
    return null;

  return req.cookies.access_token;
}

module.exports = jwtMiddleware;