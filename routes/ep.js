/**
 * Provide All Route Functions of Editing Problems
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var path        = require("path");
var router      = express.Router();
var _           = require('lodash');
var entities    = require("entities");
var Problems    = require('../models/problems');
var EditProblem = require('./edit_problem/editProblem');


/**
 *
 */
router.get('/', function(req, res, next) {




    res.render('ep', {
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
router.get('/new', function(req, res, next) {


    res.render('epN', {
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
router.get('/:pid/1', function(req, res, next) {

    EditProblem.step1Get(req,res,next);

});


/**
 *
 */
router.get('/:pid/2', function(req, res, next) {
    EditProblem.step2Get(req, res, next);
});


/**
 *
 */
router.get('/:pid/3', function(req, res, next) {

    EditProblem.step3Get(req,res,next);

});


/**
 *
 */
router.post('/', function(req, res, next) {
    res.redirect('/ep');
});


/**
 *
 */
router.post('/new/', function(req, res, next) {

    if( req.body ) {

        var inserts = {
            name: entities.encodeHTML(req.body.name),
            status: 'incomplete',
            input: entities.encodeHTML(req.body.input),
            output: entities.encodeHTML(req.body.output),
            author: entities.encodeHTML(req.body.author),
            statement: entities.encodeHTML(req.body.statement),
            score: entities.encodeHTML(req.body.score)
        };


        Problems.insert('problems',inserts, function(err,row){

            if( err ) { return next(new Error(err)); }

            res.redirect('/ep/' + row.insertId + '/2');

        });

    }else{
        res.end('REQUEST BODY NOT FOUND');
    }


});


/**
 *
 */
router.post('/rtc/', function(req, res, next) {

    EditProblem.removeTestCase(req,res,next);

});


/**
 *
 */
router.post('/:pid/1', function(req, res, next) {

    EditProblem.step1Post(req, res, next);

});


/**
 *
 */
router.post('/:pid/2', function(req, res, next) {

    EditProblem.step2Post(req, res, next);

});


/**
 * Test Judge Solution as well as set limits
 */
router.post('/:pid/tjs', function(req, res, next) {

    EditProblem.testJudgeSolution(req, res, next);

});



module.exports = router;