var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var path        = require("path");
var async       = require('async');


module.exports = function(req,res,next){
    var module = {};

    module.get = function(){


                Problems.findById(req.params.pid,function(err,row){

                    if( err ) { return next(new next(err)); }

                    if( row.length == 0 ) { return next(new Error('what you r looking for!')); }
                    //if( row[0].status == 'incomplete' ) { return callback(new Error('what you r looking for!!!')); }

                    res.render('ep3', {
                        title: "editproblem | JUST Online Judge",
                        locals: req.app.locals,
                        isLoggedIn: req.isAuthenticated(),
                        user: req.user,
                        _: _,
                        pid: req.params.pid,
                    });

                });


    };

    module.post = function(){
        res.end('Constructing!');
    };

    return module;
};
