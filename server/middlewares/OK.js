'use strict';

module.exports = function(type){
  return function httpOk(req, res, next){
    return type === 'ok'
      ? res.sendStatus(200)
      : next();
  };
};