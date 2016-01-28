/**
 * Login page route
 * @type {*|exports|module.exports}
 */

var express         = require('express');
var passport        = require('passport');
var isLoggedIn      = require('../middlewares/isLoggedIn');
var router          = express.Router();


router.get('/' , isLoggedIn(false) ,function(req, res, next) {

    res.render('login',{
        errors: req.flash('loginFailure'),
        success: req.flash('success')
    });

});


router.post('/' ,passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash : true
    })
);


module.exports = router;
