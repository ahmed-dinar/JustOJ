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

router.get('/', function(req, res, next) {

    res.render('ranks', {
        title: "JUST Online Judge - Ranks",
        isUser: req.isAuthenticated(),
        user: req.user
    });

});


router.get('/p/:pid', function(req, res, next) {

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
                    attributes: ['language','submittime','cpu','memory','username'],
                    table: 'submissions',
                    cur_page: cur_page,
                    limit: 20,
                    where:{
                        pid: pID,
                        status: '0'
                    },
                    min: 'cpu',
                    group: 'uid',  //for unique users
                    order:{
                        by: 'cpu'
                    },
                    leftJoin:{
                        table: 'users',
                        pcol: 'uid',
                        scol: 'id'
                    }
                } , function(err,rows,pagination){

                    if( err ){ return callback(err); }


                    callback(null,pName,pagination,rows);

                });

            }
        ], function (error, pName, pagination, rank) {

            if( error ){ return next(new Error(error)); }


            if( _.isUndefined(rank) || rank.length === 0 ){
                rank = {};
            }




            res.render('problem_rank' , {
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                runStatus: MyUtil.runStatus(),
                langNames: MyUtil.langNames(),
                moment: moment,
                rank: rank,
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