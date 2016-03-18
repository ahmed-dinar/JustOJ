var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var path        = require("path");
var entities    = require("entities");


module.exports = function(req,res,next){
    var module = {};

    module.get = function(){
        Problems.findById(req.params.pid,function(err,row){

            if( err ) { return next(new Error(err)); }

            if( row.length == 0 ) { return next(new Error('what you r looking for!')); }
            //if( row[0].status == 'incomplete' ) { return next(new Error('what you r looking for!!!')); }


            res.render('ep1', {
                title: "editproblem | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                _: _,
                pid: req.params.pid,
                data: Problems.decodeToHTML(row[0])
            });

        });
    };

    module.post = function(){

        if( req.body ) {

            var inserts = {
                attributes:{
                    name: entities.encodeHTML(req.body.name),
                    status: 'incomplete',
                    input: entities.encodeHTML(req.body.input),
                    output: entities.encodeHTML(req.body.output),
                    author: entities.encodeHTML(req.body.author),
                    score: entities.encodeHTML(req.body.score),
                    statement: entities.encodeHTML(req.body.statement)
                },
                where:{
                    pid: req.params.pid
                }
            };


            Problems.update('problems',inserts, function(err,row){

                if( err ) { return next(new Error( 'Problem Update Error : ' +  err)); }

                if( row.length == 0 ) { return next(new Error('something went wrong with updating! :(')); }

                res.redirect('/ep/' + req.params.pid + '/2');

            });

        }else{
            res.end('REQUEST BODY NOT FOUND');
        }

    };

    return module;
};
