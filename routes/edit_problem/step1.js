'use strict';

/**
 * Module dependencies.
 */
var Problems = require('../../models/problems');
var _ = require('lodash');
var logger = require('winston');

module.exports = function(req,res,next){
  var module = {};

  module.get = function(){

    Problems.findById(req.params.pid,[],function(err,row){

      if( err ) {
        logger.error(err);
        return next(new Error(err));
      }

      if( !row.length )
        return next(new Error('404 no problem found'));
            //if( row[0].status == 'incomplete' ) { return next(new Error('what you r looking for!!!')); }

      res.render('problem/edit/step_1', {
        active_nav: 'problems',
        title: 'editproblem | JUST Online Judge',
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        _: _,
        pid: req.params.pid,
        problem: Problems.decodeToHTML(row[0])
      });
    });
  };

  module.post = function(){

    if( !req.body )
      return next(new Error('no body found'));

    Problems.update(req, function(err,row){

      if( err ) {
        logger.error(err);
        return next(new Error( 'Problem Update Error'));
      }

      if( !row.length )
        return next(new Error('something went wrong with updating! :('));

      res.redirect('/problems/edit/' + req.params.pid + '/2');
    });
  };

  return module;
};
