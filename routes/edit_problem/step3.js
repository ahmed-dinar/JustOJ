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

        async.waterfall([
            function(callback) {

                Problems.findById(req.params.pid,['id'],function(err,row){

                    if( err ) { return next(new Error(err)); }

                    if( row.length == 0 ) { return next(new Error('what you r looking for!')); }

                    callback();
                });
            },
            function(callback) {

                var cpu = req.body.ftl;
                var memory = req.body.fml;

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
                    res.redirect('/ep/' + req.params.pid + '/3');
                    return;
                }
                return next(new Error(error));
            }

            res.redirect('/problems');

        });

    };

    return module;
};
