/**
 * Login page route
 * @type {*|exports|module.exports}
 */

var express = require('express');
var passport = require('passport');
var isLoggedIn = require('../middlewares/isLoggedIn');
var router = express.Router();


router.get('/' , isLoggedIn(false) ,function(req, res, next) {

    res.render('login',{
        active_nav: '',
        errors: req.flash('loginFailure'),
        success: req.flash('success'),
        isLoggedIn: false,
        postUrl: req.originalUrl
    });
});


router.post('/', passport.authenticate('local-login', {
    failureRedirect: '/login',
    failureFlash: true
}), function (req, res) {
    var ref_page = req.query.redirect ? req.query.redirect : '/';
    res.redirect(ref_page);
});


module.exports = router;
