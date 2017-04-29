/**
 *
 * @type {*|exports|module.exports}
 */
var express = require('express');
var router = express.Router();

var async = require('async');
var _ = require('lodash');
var Recaptcha = require('recaptcha').Recaptcha;

var isLoggedIn = require('../middlewares/isLoggedIn');
var TempUser = require('../models/tempuser');
var User = require('../models/user');
var Schema = require('../config/form-validation-schema');
var CustomError = require('../helpers/custom-error');
var Secrets = require('../files/secrets/Secrets');

var debug = require('debug')('routes:resister');


router.get('/', isLoggedIn(false) , function(req, res, next) {

    var recaptcha = new Recaptcha(Secrets.recaptcha.SITE_KEY, Secrets.recaptcha.SECRET_KEY);

    res.render('resister', {
        active_nav: '',
        layout: true,
        recaptcha_form: recaptcha.toHTML(),
        errors: req.flash('resFailure'),
        isLoggedIn: false,
        _: _
    });
});



router.post('/', isLoggedIn(false) , function(req, res, next) {

    async.waterfall([
        function(callback) {
            verifyRecaptcha(req,callback);
        },
        function(callback) {
            validateForm(req,callback);
        },
        function(callback){
            TempUser.resister(req,callback);
        }
    ], function (err, result) {

        if(err){

            console.error(err);

            switch (err.name){
                case 'captcha':
                    req.flash('resFailure', err);
                    res.redirect('/resister');
                    break;
                case 'form':
                    req.flash('resFailure', err);
                    res.redirect('/resister');
                    break;
                default:
                    console.log('I am in default resister error!');
                    next(err);
            }
            return;
        }

        req.flash('success', 'Successfully resisterd! A varification link sent to ' + req.body.email + '. Please follow the link to activate account in 24 hours.');
        res.redirect('/login');
    });

});



var validateForm = function(req,cb){

    req.checkBody(Schema.resistration);
    req.assert('conpassword', 'Password does not match').equals(req.body.password);

    var formErrors = req.validationErrors();

    console.log('verifying form..');

    if (formErrors) return cb(new CustomError(formErrors,'form'));

    console.log('if user avaiable..');

    User.available(req.body.username,req.body.email,function(err,rows){
        if(err) return cb(err);

        if( rows.length ){
            formErrors = [];
            formErrors.push({
                param: rows[0].username ? 'username' : 'email',
                msg: rows[0].username ? 'Username already taken' : 'Email already taken',
                value: rows[0].username ? req.body.username : req.body.email
            });
            return cb(new CustomError(formErrors,'form'));
        }

        cb();
    });
};


var verifyRecaptcha = function(req,cb){
    var recaptchaData = {
        remoteip:  req.connection.remoteAddress,
        challenge: req.body.recaptcha_challenge_field,
        response:  req.body.recaptcha_response_field
    };
    var recaptcha = new Recaptcha(Secrets.recaptcha.SITE_KEY, Secrets.recaptcha.SECRET_KEY, recaptchaData);

    console.log('verifying captcha..');

    recaptcha.verify(function(success, error_code) {
        if(!success) return cb(new CustomError('Captcha does not match','captcha'));

        cb();
    });
};

module.exports = router;
