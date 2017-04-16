

/**
 *
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var router      = express.Router();

var _           = require('lodash');
var async       = require('async');
var moment      = require("moment");
var colors      = require('colors');
var url         = require('url');

var Paginate    = require('../helpers/paginate');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var User        = require('../models/user');
var Query       = require('../config/database/knex/query');
var DB          = require('../config/database/knex/DB');
var entities    = require('entities');
var isLoggedIn  = require('../middlewares/isLoggedIn');
var roles       = require('../middlewares/userrole');

var EditProblem = require('./edit_problem/editProblem');



router.get('/', function(req, res, next) {

    async.waterfall([
        function(callback) {
            findProblems(req,callback);
        },
        function(rows,pagination,callback){

            return callback(null,rows,pagination);

            /*if( !req.isAuthenticated() ){
                return callback(null,rows,pagination);
            }

            //TODO: currenty disabled, implement it! , NOTE: USE Left join insted of separate query
            User.problemStatus(req.user.id, function(err,status){

                if( err ){ return callback(err); }

                callback(null,rows,pagination,status);

            });*/
        }
    ], function (error, problems, pagination, status) {
        if( error ){ return next(new Error(error)); }

        console.log(status);

        res.render('problem/problems', {
            active_nav: "problems",
            title: "Problems | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            _: _,
            problems: _.isUndefined(problems) ? {} : problems,
            pagination: _.isUndefined(pagination) ? {} : pagination,
            status: _.isUndefined(status) ? {} : status,
            decodeToHTML: entities.decodeHTML
        });
    });
});



router.get('/create', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

    res.render('problem/create/new', {
        active_nav: "problems",
        title: "editproblem | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        _: _
    });

});


/**
 * First step of editing a problem
 */
router.get('/edit/:pid/1', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step1Get(req,res,next);
});


/**
 * Second step of editing a problem
 */
router.get('/edit/:pid/2', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step2Get(req, res, next);
});



/**
 * Third and final step of editing a problem
 */
router.get('/edit/:pid/3', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step3Get(req,res,next);
});


/**
 *
 */
router.post('/create/', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {

    if( !req.body )
        return next(new Error('REQUEST BODY NOT FOUND'));

    Problems.insert(req, function(err,pid){
        if( err ){ return next(new Error(err)); }

        res.redirect('/problems/edit/' + pid + '/2');
    });
});


/**
 * rtc = remove test case
 */
router.post('/rtc/', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.removeTestCase(req,res,next);
});


/**
 *
 */
router.post('/edit/:pid/1', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step1Post(req, res, next);
});


/**
 *
 */
router.post('/edit/:pid/2', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step2Post(req, res, next);
});


/**
 *
 */
router.post('/edit/:pid/3', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.step3Post(req, res, next);
});


/**
 * tjs = Test Judge Solution, as well as set limits
 */
router.post('/edit/:pid/tjs', isLoggedIn(true) , roles.is('admin'), function(req, res, next) {
    EditProblem.testJudgeSolution(req, res, next);
});


/**
 *
 */
router.get('/:pid', function(req, res, next) {
    var pid = getPID(req.params.pid);

    if( pid === null ) return next(new Error('Invalid problem?'));

    async.waterfall([
            function(callback) {
                findProblem(pid,callback);
            },
            function(problem,callback){    //TODO: use left join insted of separte query
                findRank(pid,problem,callback);
            },
            function(problem,rank,callback){  //TODO: may be left join??

                if( !req.isAuthenticated() ){
                    return callback(null,problem,rank,{});
                }

                findUserSubmissions(pid,req.user.id,problem,rank,callback);
            }
        ], function (error, problem, rank, userSubmissions) {

            if( error && !problem ){
                return next(new Error(error));
            }

            if( problem.length === 0 ){
                res.status(404);
                return next(new Error('404 No problem found!'));
            }

            if( problem[0].status !== 'public' ){
                res.status(403);
                return next(new Error('403 problem not found!'));
            }

            var tags = _.split(problem[0].tags, ',', 20);
            tags = (tags[0]==='') ? [] : tags;

            res.render('problem/view' , {
                active_nav: "problems",
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                problem: Problems.decodeToHTML(problem[0]),
                rank: rank,
                tags: tags,
                userSubmissions: userSubmissions,
                tagName: MyUtil.tagNames(),
                runStatus: MyUtil.runStatus(true),
                _: _,
                moment: moment,
                formError: req.flash('formError')
            });
        });
});



/**
 * Find a Problem with tags
 * @param pid
 * @param cb
 */
var findProblem = function(pid,cb){
    Problems.findByIdandTags(pid,function(err,rows){
        if( err ) { return cb(err); }

        if( !rows || rows.length == 0 ) { return cb('problem row lenght 0!',[]); }

        cb(null,rows);
    });
};


/**
 *
 * @param pid
 * @param problem
 * @param cb
 */
var findRank = function(pid,problem,cb){
    Problems.findRank(pid,function(err,rows){
        if( err ) { return cb(err); }

        if( _.isUndefined(rows) || rows.length === 0 ){
            return cb(null,problem,{});
        }

        cb(null,problem,rows);
    });
};


/**
 *
 * @param pid
 * @param uid
 * @param problem
 * @param rank
 * @param cb
 */
var findUserSubmissions = function(pid,uid,problem,rank,cb){

    Problems.findUserSubmissions(pid,uid,function(err,rows){
        if( err ) return cb(err);

        if( _.isUndefined(rows) || rows.length === 0 ){
            return cb(null,problem,rank,{});
        }

        cb(null,problem,rank,rows);
    });
};


/**
 * Find some public problems
 * @param req
 * @param cb
 * @returns {*}
 */
var findProblems = function(req,cb){

    var cur_page = req.query.page;

    if( _.isUndefined(cur_page) ){
        cur_page = 1;
    }else{
        cur_page = parseInt(cur_page);
    }

    if( cur_page<1 ) return cb('what are u looking for!');

    Paginate.paginate({
            cur_page: cur_page,
            sql: Query.select(['id','title','submissions','solved','difficulty']).from('problems').where('status','public'),
            sqlCount: Query.count('id as count').from('problems').where('status','public'),
            limit: 5,
            url: url.parse(req.originalUrl).pathname
        },
        function(err,rows,pagination) {
            if( err ){ return cb(err); }

            cb(null,rows,pagination);
        });
};


/**
 * Decode the JOP0 formated problem code
 * @param pid
 * @returns {*}
 */
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
