var express     = require('express');
var user        = require('../models/user');
var router      = express.Router();

var _           = require('lodash');

var isLoggedIn  = require('../middlewares/isLoggedIn');
var MyUtil      = require('../helpers/myutil');
var Problems    = require('../models/problems');
var Paginate    = require('../helpers/paginate');
var moment      = require("moment");
var async       = require('async');

router.get('/' , function(req, res, next) {

    res.render('status', {
        title: "JUST Online Judge - Status",
        isUser: req.isAuthenticated(),
        user: req.user
    });

});


router.get('/u/:pid' , isLoggedIn(true), function(req, res, next) {

    var uID = req.user.id;
    var pID = req.params.pid;

    if( MyUtil.isNumeric(pID) ){


        async.waterfall([
            function(callback) {
                Problems.findById(pID,['title'],function(err,rows){
                    if(err){ return callback(err); }

                    if(rows.length===0){ return callback('What Are You Looking For?'); }

                    callback(null,rows[0].title);
                });
            },
            function(pName,callback) {

                var cur_page = req.query.page;

                if( _.isUndefined(cur_page) ){
                    cur_page = 1;
                }else{
                    cur_page = parseInt(cur_page);
                }

                if( cur_page<1 ) {
                    return callback('what are u looking for!');
                }

                Paginate.findAll({
                    table: 'submissions',
                    cur_page: cur_page,
                    limit: 20,
                    where:{
                        pid: pID,
                        uid: String(uID)
                    },
                    order:{
                        by: 'submittime',
                        desc: true
                    }
                } , function(err,rows,pagination){

                    if( err ){ return callback(err); }


                    callback(null,pName,pagination,rows);

                });

            }
        ], function (error, pName, pagination, status) {

            if( error ){ return next(new Error(error)); }


            if( _.isUndefined(status) || status.length === 0 ){
                status = {};
            }

            res.render('u_problem_status' , {
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                moment: moment,
                status: status,
                pName: pName,
                pid: pID,
                pagination: _.isUndefined(pagination) ? {} : pagination
            });


        });


        return;
    }

    next(new Error('What R U looking for?'));
});


module.exports = router;