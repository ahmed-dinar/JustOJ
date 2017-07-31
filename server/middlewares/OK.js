'use strict';

module.exports = function(type){
  return function(req, res, next){
    return type === 'ok'
      ? res.sendStatus(200)
      : next();
  };
};