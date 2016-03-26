/**
 *
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var router      = express.Router();

var _           = require('lodash');

var Paginate    = require('../helpers/paginate');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var User        = require('../models/user');
var async       = require('async');
var moment      = require("moment");
var colors      = require('colors');


router.get('/', function(req, res, next) {



    async.waterfall([
        function(callback) {
            findProblems(req,callback);
        },
        function(rows,pagination,callback){
            if( !req.isAuthenticated() ){
                return callback(null,rows,pagination);
            }

            User.problemStatus(req.user.id, function(err,status){

                if( err ){ return callback(err); }

                callback(null,rows,pagination,status);

            });
        }
    ], function (error, problems, pagination, status) {


        if( error ){ return next(new Error(error)); }


        res.render('problems', {
            title: "Problems | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            _: _,
            problems: _.isUndefined(problems) ? {} : problems,
            pagination: _.isUndefined(pagination) ? {} : pagination,
            status: _.isUndefined(status) ? {} : status
        });


    });


});



router.get('/:pid', function(req, res, next) {
    var pid = getPID(req.params.pid);


    if( pid ){

        async.waterfall([
            function(callback) {
                findProblem(pid,callback);
            },
            function(problem,callback){
                findRank(pid,problem,callback);
            },
            function(problem,rank,callback){

                if( !req.isAuthenticated() ){
                    return callback(null,problem,rank,{});
                }

                findUserSubmissions(pid,req.user.id,problem,rank,callback);
            }
        ], function (error, problem, rank, userSubmissions) {

            if( error ){ return next(new Error(error)); }


            var tags = _.split(problem[0].tags, ',', 20);
            tags = (tags[0]==='') ? [] : tags;


            res.render('viewproblem' , {
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                problem: Problems.decodeToHTML(problem[0]),
                rank: rank,
                tags: tags,
                userSubmissions: userSubmissions,
                tagName: MyUtil.tagNames(),
                runStatus: MyUtil.runStatus(),
                _: _,
                moment: moment,
                formError: req.flash('formError')
            });

        });

        return;
    }

     console.log('OOPSSS' );
     next(new Error('Invaild problem?'));

});


var findProblem = function(pid,cb){


    Problems.GROUP_CONCAT(pid,function(err,rows){
         if( err ) { return cb(err); }

         if( rows.length == 0 ) { return cb('probelem row lenth 0?'); }

         cb(null,rows);

     });
};


var findRank = function(pid,problem,cb){

    Problems.findRank(pid, 5,function(err,rows){
        if( err ) { return cb(err); }


        if( _.isUndefined(rows) || rows.length === 0 ){
            return cb(null,problem,{});
        }

        cb(null,problem,rows);
    });

};


var findUserSubmissions = function(pid,uid,problem,rank,cb){

    var opts = {
        pid: pid,
        uid: uid,
        limit: 5
    };
    Problems.findUserSubmissions(opts, function(err,rows){
        if( err ) { return cb(err); }

        if( _.isUndefined(rows) || rows.length === 0 ){
            return cb(null,problem,rank,{});
        }

        cb(null,problem,rank,rows);
    });

};


var findProblems = function(req,cb){

    var cur_page = req.query.page;

    if( _.isUndefined(cur_page) ){
        cur_page = 1;
    }else{
        cur_page = parseInt(cur_page);
    }

    if( cur_page<1 ) { return cb('what are u looking for!'); }


    var opts = {
        table: MyUtil.tables().problem,
        cur_page: cur_page,
        limit: MyUtil.paginationLimit()
    };
    Paginate.findAll(opts , function(err,rows,pagination){

        if( err ){ return cb(err); }

        cb(null,rows,pagination);

    });

};


function getPID(pid){
    if( _.isString(pid) ){
        var h = '',i;
        for( i=0; i<pid.length; i++){
            var ch = pid.charAt(i);
            if( ch === '0'  ){
                break;
            }
            h += ch;
        }

        if( h === 'JOP' ){
            h = '';
            for(i=i+1; i<pid.length; i++){
                h += pid.charAt(i);
            }
            return h;
        }
    }
    return null;
}




module.exports = router;
