var express     = require('express');
var Recaptcha   = require('recaptcha').Recaptcha;
var isLoggedIn  = require('../middlewares/isLoggedIn');
var tempuser    = require('../models/tempuser');
var User        = require('../models/user');
var passport    = require('passport');


var router      = express.Router();



//recapctcha keys
var SITE_KEY  = '6LfADw4TAAAAADvBjKLdmd_tuxnFteqwA5WC6eLH';
var SECRET_KEY = '6LfADw4TAAAAAIIN_0gvzzAW4bW0RCS7JUAwz239';


/* GET resister page. */
router.get('/', isLoggedIn(false) , function(req, res, next) {

        var recaptcha = new Recaptcha(SITE_KEY, SECRET_KEY);

        res.render('resister', {
            layout: true,
            recaptcha_form: recaptcha.toHTML(),
            errors: req.flash('resFailure')
        });

});



router.post('/', isLoggedIn(false) , function(req, res, next) {

    var data = {
        remoteip:  req.connection.remoteAddress,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
    };

    var recaptcha = new Recaptcha(SITE_KEY, SECRET_KEY, data);

    recaptcha.verify(function(success, error_code) {
        if (success) {
            tempuser.resister(req,res,next);
        }
        else {
            req.flash('resFailure', 'invalid captcha');
            res.redirect('/resister');
        }
    });

});





module.exports = router;
