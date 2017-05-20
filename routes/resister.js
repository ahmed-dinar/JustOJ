'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var express = require('express');
var router = express.Router();

var has = require('has');
var async = require('async');
var reCAPTCHA = require('recaptcha2');
var logger = require('winston');

var isLoggedIn = require('../middlewares/isLoggedIn');
var TempUser = require('../models/tempuser');
var User = require('../models/user');
var Schema = require('../config/validator-schema');
var CustomError = require('../lib/custom-error');
var Secrets = require('../files/secrets/Secrets');


/**
 *
 */
router.get('/', isLoggedIn(false) , function(req, res, next) {

    res.render('resister', {
        active_nav: 'resister',
        layout: true,
        RECAPTCHA_KEY: Secrets.recaptcha2.SITE_KEY,
        errors: req.flash('resFailure'),
        isLoggedIn: false,
        forEach: require('lodash/forEach')
    });
});


/**
 *
 */
router.post('/', isLoggedIn(false) , function(req, res, next) {

    async.waterfall([
        function(callback) {
            verifyRecaptcha(req,callback);
        },
        function (callback) {

            req.checkBody(Schema.resistration);
            req.assert('conpassword', 'Password does not match').equals(req.body.password);

            req.getValidationResult().then(function(result) {
                if (!result.isEmpty())
                    return callback(new CustomError(result,'form'));

                return callback();
            });
        },
        function (callback) {
            User.available(req.body.username,req.body.email,function(err,rows){

                if(err)
                    return callback(err);

                if( rows.length ){
                    if( rows[0].username )
                        return callback(new CustomError('Username already taken','form'));
                    else
                        return callback(new CustomError('Email already taken','form'));
                }

                return callback();
            });
        },
        function(callback){
            TempUser.resister(req,callback);
        }
    ], function (err, result) {

        if(err){

            logger.debug(err);

            if( !has(err,'name') )
                return next(new Error(err));

            switch (err.name){
                case 'captcha':
                    req.flash('resFailure', err);
                    res.redirect('/resister');
                    break;
                case 'form':
                    req.flash('resFailure', err.message);
                    res.redirect('/resister');
                    break;
                default:
                    next(err);
            }
            return;
        }

        req.flash('success', 'Successfully resisterd! A varification link sent to ' + req.body.email + '. Please follow the link to activate account in 24 hours.');
        res.redirect('/login');
    });
});



/**
 *
 * @param req
 * @param cb
 */
var verifyRecaptcha = function(req,cb){

    var recaptcha = new reCAPTCHA({
        siteKey: Secrets.recaptcha2.SITE_KEY,
        secretKey: Secrets.recaptcha2.SECRET_KEY
    });

    recaptcha.validateRequest(req)
        .then(function(){
            cb();
        })
        .catch(function(errorCodes){
            logger.debug(recaptcha.translateErrors(errorCodes));
            cb(new CustomError('Captcha does not match','captcha'));
        });
};

module.exports = router;
