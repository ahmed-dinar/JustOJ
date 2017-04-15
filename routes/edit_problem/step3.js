var Problems    = require('../../models/problems');
var MyUtil      = require('../../helpers/myutil');
var _           = require('lodash');
var Busboy      = require('busboy');
var fse         = require('fs-extra');
var path        = require("path");
var async       = require('async');


module.exports = function(req,res,next){

    var module = {};

    module.get = function(){

        Problems.findById(req.params.pid,['id'],function(err,row){

            if( err ) { return next(new Error(err)); }

            if( row.length == 0 ) { return next(new Error('what you r looking for!')); }

            res.render('problem/edit/step_3', {
                active_nav: "problems",
                title: "editproblem | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                pid: req.params.pid,
                error: req.flash('error')
            });

        });

    };

    module.post = function(){

        var cpu = req.body.ftl;
        var memory = req.body.fml;

        if( parseFloat(cpu) < 0.0 || parseFloat(cpu)>5.0 ){
            req.flash('error', 'cpu limit should not be less than zero or greater than 5s');
            res.redirect('/problems/edit/' + req.params.pid + '/3');
            return;
        }

        if( parseInt(memory) < 0.0 || parseInt(memory)>256 ){
            req.flash('error', 'memory limit should not be less than zero or greater than 256mb');
            res.redirect('/problems/edit/' + req.params.pid + '/3');
            return;
        }

        async.waterfall([
            function(callback) {

                Problems.findById(req.params.pid,['id'],function(err,row){

                    if( err ) { return next(new Error(err)); }

                    if( row.length == 0 ) { return next(new Error('what you r looking for!')); }

                    callback();
                });
            },
            function(callback) {

                if( cpu && memory &&
                    MyUtil.isNumeric(cpu) &&
                    MyUtil.isNumeric(memory) ){

                    var limits = {
                        cpu: parseInt(parseFloat(cpu)*1000.0),
                        memory: memory
                    };

                    Problems.updateLimits(req.params.pid,limits,function(err,row){

                        if(err){
                            console.log('Set limit db error');
                            console.log(err);
                            return callback(err);
                        }

                        callback();
                    });
                    return;
                }
                callback({field: 'Invalid Or Empty Field' });
            }
        ], function (error, result) {

            if( error ){

                if( error.field ){
                    req.flash('error', error.field);
                    res.redirect('/problems/edit/' + req.params.pid + '/3');
                    return;
                }
                return next(new Error(error));
            }

            res.redirect('/problems');

        });

    };

    return module;
};
