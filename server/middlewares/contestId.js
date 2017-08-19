'use strict';

var config = require('nconf');
var Hashids = require('hashids');
var contestHash = new Hashids(config.get('HASHID:CONTEST'), 11);

//
// decode contest id from hash and save in req
//
function cidMiddleware(req, res, next){
  var cid = contestHash.decode(req.params.cid);

  if(!cid || !cid.length){
    return res.sendStatus(404);
  }

  req.contestId = cid[0];
  return next();
}


module.exports = cidMiddleware;