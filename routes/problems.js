

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
var has         = require('has');


var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var User        = require('../models/user');
var DB          = require('../config/database/knex/DB');
var entities    = require('entities');
var isLoggedIn  = require('../middlewares/isLoggedIn');
var roles       = require('../middlewares/userrole');

var EditProblem = require('./edit_problem/editProblem');


router.get('/', function(req, res, next) {
    
    var cur_page;
    if( !has(req.query,'page') )
        cur_page = 1;
    else
        cur_page = parseInt(req.query.page);

    if( cur_page<1 )
        return next(new  Error('401'));

    var URL = url.parse(req.originalUrl).pathname;
    var uid = req.isAuthenticated() ? req.user.id : -1;


    //TODO:
    //TODO: AGAIN TODO!!:  please please check the query with user id in model, is it horrible when submission table is too huge??
    Problems.findProblems(uid,cur_page,URL, function(error,problems,pagination) {
        if( error ) return next(new Error(error));

        console.log(problems);

        res.render('problem/problems', {
            active_nav: "problems",
            title: "Problems | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            _: _,
            problems: _.isUndefined(problems) ? {} : problems,
            pagination: _.isUndefined(pagination) ? {} : pagination,
            decodeToHTML: entities.decodeHTML
        });
    });
});


/**
 *
 */
router.get('/create', /*isLoggedIn(true) , roles.is('admin'), */function(req, res, next) {

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
 *
 */
router.post('/languages/template/:languageIndex', /*isLoggedIn(true) , roles.is('admin'), */function(req, res, next) {

    var languageIndex = parseInt(req.params.languageIndex);

    var resObj = {
        status: 'success',
        template: ''
    };

    if( !MyUtil.isNumeric(languageIndex) )
        resObj.status = 'error';
    else{
        resObj.template = MyUtil.langTemplates(languageIndex);
        if( resObj.template === 'error' )
            resObj.status = 'error';
    }

    res.send(JSON.stringify(resObj));
    res.end();
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
router.get('/submit/:pid', isLoggedIn(true) , function(req, res, next) {

    var problemId = req.params.pid;

    Problems.findById(problemId,['id','title'], function (err,rows) {
        if(err) return nex(new Error(err));

        if( !rows || rows.length === 0 ) return next(new Error('404'));

        console.log(rows);

        res.render('problem/submit' , {
            active_nav: "problems",
            title: "Problems | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            problem: rows[0],
            moment: moment,
            formError: req.flash('formError'),
            error: req.flash('err')
        });
    });
});


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
