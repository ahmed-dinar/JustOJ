var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var fse         = require('fs-extra');
var path        = require("path");
var async       = require('async');


module.exports = function(req,res,next){
    var module = {};

    module.get = function(){

        Problems.findById(req.params.pid,[],function(err,row){

            if( err ) { return next(new Error(err)); }

            if( row.length == 0 ) { return next(new Error('what you r looking for!')); }
            //if( row[0].status == 'incomplete' ) { return next(new Error('what you r looking for!!!')); }


            res.render('problem/edit/step_1', {
                title: "editproblem | JUST Online Judge",
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

        if( !req.body ) { return next(new Error(err)); }

        Problems.update(req, function(err,row){

            if( err ) { return next(new Error( 'Problem Update Error : ' +  err)); }

            if( row.length == 0 ) { return next(new Error('something went wrong with updating! :(')); }

            res.redirect('/problems/edit/' + req.params.pid + '/2');

        });
    };

    return module;
};
