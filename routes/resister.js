/**
 *
 * @type {*|exports|module.exports}
 */
var express     = require('express');
var router      = express.Router();

var Recaptcha   = require('recaptcha').Recaptcha;

var isLoggedIn  = require('../middlewares/isLoggedIn');
var TempUser    = require('../models/tempuser');
var User        = require('../models/user');

var Secrets     = require('../files/secrets/Secrets');


router.get('/', isLoggedIn(false) , function(req, res, next) {

        var recaptcha = new Recaptcha(Secrets.recaptcha.SITE_KEY, Secrets.recaptcha.SECRET_KEY);

        res.render('resister', {
            layout: true,
            recaptcha_form: recaptcha.toHTML(),
            errors: req.flash('resFailure'),
            isLoggedIn: false
        });
});



router.post('/', isLoggedIn(false) , function(req, res, next) {

    var recaptchaData = {
        remoteip:  req.connection.remoteAddress,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
    };

    var recaptcha = new Recaptcha(Secrets.recaptcha.SITE_KEY, Secrets.recaptcha.SECRET_KEY, recaptchaData);

    recaptcha.verify(function(success, error_code) {
        if (success) {
            TempUser.resister(req,res,next);
        }
        else {
            req.flash('resFailure', 'invalid captcha');
            res.redirect('/resister');
        }
    });

});





module.exports = router;
