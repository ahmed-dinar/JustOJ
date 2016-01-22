var express     = require('express');
var user        = require('../models/user');
var problems    = require('../models/problems');
var router      = express.Router();
var paginate    = require('../helpers/paginate');
var _           = require('lodash');
var entities    = require('entities');


router.get('/', function(req, res, next) {

    var limit=5;
    var cur_page = req.query.page;
    var table = 'problems';

    if( _.isUndefined(cur_page) ){
        cur_page = 1;
    }else{
        cur_page = parseInt(cur_page);
    }

    if( cur_page <=0 ) { return next(new Error('what are u looking for!?')); }


    paginate.findAll(table,cur_page,limit,function(err,rows,pagination){

        if( err ){ return next(err); }
        
        if( req.isAuthenticated() ) {
            user.solvedList(req.user.id, function (err,result) {

                if( err ){ return next(err); }

                res.render('problems', {
                    title: "Problems | JUST Online Judge",
                    pagination: pagination,
                    problems: rows,
                    locals: req.app.locals,
                    isLoggedIn: req.isAuthenticated(),
                    slist: result,
                    user: req.user,
                    _: _
                });

            });
        }else{
            res.render('problems', {
                title: "Problems | JUST Online Judge",
                pagination: pagination,
                problems: rows,
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                _: _
            });
        }



    });


});


router.get('/:pid', function(req, res, next) {
    var pid = req.params.pid;

    if( pid = getPID(pid) ){
        console.log('YEAH  ' + pid);

        problems.findById(pid,function(err,rows){
            if( err ) { return next(err); }

            if( rows.length == 0 ) { return next(new Error('missing probelem?')); }

            console.log(rows);

            res.render('viewproblem' , {
                title: "Problems | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                problem: problems.decodeToHTML(rows[0]),
                _: _
            });

        });

    }else{
        console.log('OOPSSS' );
        res.redirect(req.app.locals.site.url);
    }

});


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
