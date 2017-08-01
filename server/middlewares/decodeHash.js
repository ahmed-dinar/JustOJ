'use strict';

var config = require('nconf');
var has = require('has');
var logger = require('winston');
var Hashids = require('hashids');
var Problems = appRequire('models/problems');

var hashids = new Hashids(config.get('HASHID:PROBLEM'),11);

module.exports = function(validate, columns){

  return function(req, res, next){

    if( !has(req.params,'pid') ){
      return res.status(404).json({ error: 'No Problem Found' });
    }

    var pid = hashids.decode(req.params.pid);

    if( !pid || pid === undefined || !pid.length ){
      return res.status(404).json({ error: 'No Problem Found' });
    }

    //only return decoded id
    if( !validate || validate === undefined ){
      req.body.problemId = pid[0];
      return next();
    }

    //validate problem
    Problems.findById(pid[0], columns, function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      if( !rows || !rows.length ){
        return res.status(404).json({ error: 'No Problem Found' });
      }

      req.body.problem = rows[0];

      next();
    });
  };
};