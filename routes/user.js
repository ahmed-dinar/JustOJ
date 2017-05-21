'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var gravatar = require('gravatar');
var moment = require('moment');
var has = require('has');
var request = require('request');
var async = require('async');
var countries = require('country-data').countries;
var isEmail = require('validator').isEmail;
var rndm = require('rndm');
var Codeforces = require('codeforces-api');
var Nodemailer  = require('nodemailer');
var config = require('nconf');
var logger = require('winston');

var User = require('../models/user');
var isLoggedIn = require('../middlewares/isLoggedIn');
var ValidationSchema = require('../config/validator-schema');
var CustomError = require('../lib/custom-error');
var TempUser = require('../models/tempuser');


/**
 *
 */
router.get('/',function(req, res, next) {
    res.status(404)        // HTTP status 404: NotFound
        .send('Not found');
});




/**
 * TODO: check protocol in production
 *  verify a user with toekn from sent to email
 */
router.get('/verify', function(req, res, next) {

    var thishost      = "http://localhost:8888";
    var requestedhost = req.protocol + "://" + req.get('host');

    if( thishost !== requestedhost || !has(req.query,'verification') || !req.query.verification )
        return next(new Error('Page Not Found'));

    var token = req.query.verification;
    TempUser.verify(token, function (err,rows) {
        if(err)
            return next(new Error(err));

        req.flash('success', 'Email verified,You can login now!');
        res.redirect('/login');
    });
});


/**
 *
 */
router.get('/reset', function(req, res, next) {

    if( req.isAuthenticated() ){
        res.redirect('/');
        return;
    }

    if( !has(req.query,'token') )
        return next(new Error('404'));

    var token = req.query.token;

    User.getResetToken(token, function (err,rows) {
        if(err)
            return next(new Error(err));

        if(!rows.length)
            return next(new Error('invalid token'));

        logger.debug(rows);

        if( moment().isAfter(rows[0].token_expires) )
            return next(new Error('invalid token'));

        res.render('user/reset_pass',{
            active_nav: '',
            errors: req.flash('errors'),
            success: req.flash('success'),
            isLoggedIn: false,
            resetToken: token
        });
    });
});



/**
 *
 */
router.get('/:username',function(req, res, next) {

    var username = req.params.username;

    async.waterfall([
        async.apply(User.getProfile, username),
        getSocialStatus
    ], function (err, userData , contestHistory, submissionHistory) {

        if(err)
            return next(new Error(err));

        var solvedList = [];
        if( submissionHistory.length && submissionHistory[0].solvedList )
            solvedList = JSON.parse('[' + submissionHistory[0].solvedList + ']');

        submissionHistory = submissionHistory.length ? submissionHistory[0] : { solved: 0, accepted: 0, re: 0, tle: 0, mle: 0, ce: 0, wa: 0, totalSubmission: 0 };

        var profile = {
            contestHistory: contestHistory,
            userData: userData,
            submissionHistory: submissionHistory,
            solvedList: solvedList,
            profilePicture: gravatar.url(userData.email, {s: '150'}, true)
        };

        if( countries[userData.country].name )
            profile.userData.country = countries[userData.country].name;

        if(  profile.userData.publicemail && !isEmail(profile.userData.email) )
            profile.userData.publicemail = 0;

        logger.debug(profile);
        logger.debug(userData.social);

        res.render('user/profile',{
            active_nav: '',
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            username: username,
            profile: profile,
            moment: moment
        });

    });
});


/**
 *  update password from reset password token request
 */
router.post('/resetPassword', function(req, res, next) {

    if( req.isAuthenticated() ){
        res.redirect('/');
        return;
    }

    var resetToken = req.body.resetToken;
    logger.debug(req.body);

    async.waterfall([
        function (callback) {

            User.getResetToken(resetToken, function (err,rows) {
                if(err)
                    return callback(err);

                logger.debug(rows);

                if( !rows.length || moment().isAfter(rows[0].token_expires) )
                    return callback('invalid token');

                callback(null,rows[0].id);
            });
        },
        function (uid,callback) {

            req.checkBody(ValidationSchema.password);
            req.assert('conpassword', 'Password does not match').equals(req.body.password);

            req.getValidationResult().then(function(result) {
                if (!result.isEmpty())
                    return callback('formerror', result.array());

                callback(null, uid);
            });
        },
        function (uid, callback) {
            User.resetPassword(uid, req.body.password, callback);
        }
    ], function (err, info) {

        if(err){

            if(!info)
                return next(new Error(err));

            logger.debug(info);
            req.flash('errors', info);
            res.redirect('/user/reset?token=' + resetToken);
            return;
        }

        req.flash('success','password reset successful');
        res.redirect('/login');
    });
});


/**
 *  send reset password link
 */
router.post('/reset', function(req, res, next) {

    if( req.isAuthenticated() ){
        res.redirect('/');
        return;
    }

    var email = req.body.email;

    async.waterfall([
        function (callback) {
            req.checkBody(ValidationSchema.email);
            req.getValidationResult().then(function(result) {
                if (!result.isEmpty())
                    return callback('formerror', result.array());

                callback();
            });
        },
        async.apply(User.available, null, email),
        generateToken,
        function (token, callback) {
            User.setResetToken(email, token, function (err, rows) {
                if(err)
                    return callback(err);

                callback(null, token, email, req.get('host'));
            });
        },
        sendResetLink
    ], function (err, info) {

        if(err) {
            if(!info)
                return next(new Error(err));

            logger.debug(info);
            req.flash('loginFailure', info);
            res.redirect('/login');
            return;
        }

        logger.debug(info);
        req.flash('success','An email has been sent to ' + email);
        res.redirect('/login');
    });
});


/**
 *
 * @param token
 * @param email
 * @param host
 * @param callback
 */
function sendResetLink(token, email, host, callback) {

    var transporter = Nodemailer.createTransport({
        service: "Gmail",
        auth: {
            type: 'OAuth2',
            user: config.get('mail'),
            clientId: config.get('gmail:oauth:clientId'),
            clientSecret: config.get('gmail:oauth:clientSecret'),
            refreshToken: config.get('gmail:oauth:refreshToken')
        }
    });

    var link = "http://" + host + "/user/reset?token=" + token;
    var html = "Hello," + "<br><br>Please follow the link to reset your JUSTOJ account password.<br><br>"
        + "<a href=\"" + link + "\">" + link + "</a><br><br>Thank you,<br>JUSTOJ";

    var mailOptions = {
        to: email,
        subject: 'Reset password',
        text: '',
        html: html
    };

    logger.debug('sending mail..');
    logger.debug(link);

    transporter.sendMail(mailOptions, callback);
}



/**
 *
 * @param rows
 * @param callback
 * @returns {*}
 */
function generateToken(rows, callback) {

    if( !rows.length )
        return callback('404','no user found with this email');

    logger.debug('generating token..');
    crypto.randomBytes(20, function(err, buf) {
        if(err)
            return callback(err);

        var token = buf.toString('hex');
        callback(null,token);
    });
}


/**
 *
 */
router.post('/settings/profile', function(req, res, next) {

    if( !req.isAuthenticated() )
        return next(new Error('403'));

    async.waterfall([
        function (callback) {

            req.checkBody(ValidationSchema.settings.profile);

            req.getValidationResult().then(function(result) {
                if (!result.isEmpty()) 
                    return callback(new CustomError(result,'form'));
                
                return callback();
            });
        },
        function (callback) {

            var fileds = {
                'name': req.body.name,
                'website': req.body.website,
                'institute': req.body.institution,
                'country': req.body.country,
                'city': req.body.location
            };

            User.updateProfile({ id: req.user.id, fields: fileds }, callback);
        }
    ], function (err,rows) {
        
        if(err){
            if( has(err,'name') && err.name === 'form' ){
                logger.debug(err.message.array());
                req.flash('err','form error');
                res.redirect('/user/settings/profile');
                return;
            }
            return next(new Error(err));
        }



        req.flash('success','profile updated');
        res.redirect('/user/settings/profile');
    });
});




/**
 *  change password from edit profile page
 */
router.post('/settings/changepassword', function(req, res, next) {

    if( !req.isAuthenticated() )
        return next(new Error('403'));

    if( req.body.newpassword !== req.body.confirmpassword ){
        req.flash('err','please confirm password');
        res.redirect('/user/settings/profile');
        return;
    }

    var credentials = {
        'id': req.user.id,
        'password': req.user.password,
        'currentpassword': req.body.currentpassword,
        'newpassword': req.body.newpassword
    };

    User.changePassword(credentials, function (err,rows) {
        if(err) {
            if( has(err,'name') && err.name === 'form'){
                req.flash('err',err.message);
                res.redirect('/user/settings/profile');
                return;
            }
            return next(err);
        }

        req.flash('success','password updated');
        res.redirect('/user/settings/profile');
    });
});




/**
 *
 */
router.get('/settings/profile', isLoggedIn(true), function(req, res, next) {

    var username = req.user.username;

    User.getProfile(username, function (err, userData , contestHistory, submissionHistory) {
        if(err) return next(new Error(err));

        var solvedList = [];
        if( submissionHistory.length && submissionHistory[0].solvedList )
            solvedList = JSON.parse('[' + submissionHistory[0].solvedList + ']');

        submissionHistory = submissionHistory.length
            ? submissionHistory[0]
            : { solved: 0, accepted: 0, re: 0, tle: 0, mle: 0, ce: 0, wa: 0, totalSubmission: 0 };
        var profile = {
            contestHistory: contestHistory,
            userData: userData,
            submissionHistory: submissionHistory,
            solvedList: solvedList,
            profilePicture: gravatar.url(userData.email, {s: '150'}, true)
        };

        if( !userData.uva_userid.length )
            profile.randomUvaName = rndm(10);

        if( !userData.cf_username.length )
            profile.randomCfEmail = rndm(8);

        logger.debug(profile);

        res.render('user/settings/profile',{
            active_nav: '',
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            error: req.flash('err'),
            success: req.flash('success'),
            username: username,
            profile: profile,
            auth_error: req.flash('auth_error'),
            auth_success: req.flash('auth_success'),
            moment: moment
        });
    });
});



/**
 *
 * @param userData
 * @param contestHistory
 * @param submissionHistory
 * @param callback
 */
function getSocialStatus(userData , contestHistory, submissionHistory, callback) {

    async.parallel([
            async.apply(getGithubInfo,userData.github_token),
            async.apply(getStackoverflowInfo,userData.stack_token),
            async.apply(getCodeforcesInfo,userData.cf_username),
            async.apply(getUvaInfo,userData.uva_userid)
        ],
        function(err, results) {
            userData.social = results;
            callback(null,userData , contestHistory, submissionHistory);
        });
}


/**
 *
 * @param uvaId
 * @param callback
 */
function getUvaInfo(uvaId, callback) {

    if( uvaId == '' )
        return callback(null,null);

    var profileUrl = 'http://uhunt.felix-halim.net/api/ranklist/'+uvaId+'/0/0';
    request
        .get(profileUrl, function (err, response, body) {

            var uvaData = null;
            if(err || response.statusCode !== 200) {
                logger.debug(err);
            }
            else{
                body = JSON.parse(body);
                if( body.length ) {
                    uvaData = {
                        rank: body[0].rank,
                        solved: body[0].ac
                    };
                }
            }

            callback(null,uvaData);
        });
}


/**
 *
 * @param cf_username
 * @param callback
 */
function getCodeforcesInfo(cf_username, callback) {

    if( cf_username == '' )
        return callback(null,null);

    Codeforces.setApis( config.get('codeforces:key'), config.get('codeforces:secret') );
    Codeforces.user.info({ handles: cf_username } , function (err, data) {

        var cfData = null;
        if(err) {
            logger.debug(err);
        }
        else if( data.length ){
            data = data[0];
            cfData = {
                rating: data.rating,
                rank: data.rank,
                maxRating: data.maxRating,
                maxRank: data.maxRank,
                contribution: data.contribution
            };
        }

        callback(null,cfData);
    });
}


/**
 *
 * @param githubToken
 * @param callback
 */
function getGithubInfo(githubToken, callback) {

    if( githubToken == '' )
        return callback(null,null);

    var userAgent = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36';
    var profileUrl = 'https://api.github.com/user?access_token=' + githubToken;
    request
        .get({
            url: profileUrl,
            headers: {
                'User-Agent': userAgent
            }
        }, function (err, response, body) {

            var gitData = null;
            if(err || response.statusCode !== 200) {
                logger.debug(err);
            }
            else {
                body = JSON.parse(body);
                gitData = {
                    repos: body.public_repos,
                    followers: body.followers
                };
            }

            callback(null,gitData);
        });
}


/**
 *
 * @param stackToken
 * @param callback
 */
function getStackoverflowInfo(stackToken, callback) {

    if( stackToken == '' )
        return callback(null,null);

    var profileUrl = 'https://api.stackexchange.com/2.2/me?site=stackoverflow&key=' + config.get('stackexchange:key') + '&access_token=' + stackToken;
    request
        .get({
            url: profileUrl,
            gzip: true
        } , function (err, response, body) {

            var stackData = null;
            if(err || response.statusCode !== 200) {
                logger.debug(err);
            }else{
                body = JSON.parse(body);
                stackData = {
                    reputation: body.items[0].reputation,
                    badges: body.items[0].badge_counts,
                };
            }
            callback(null,stackData);
        });
}



module.exports = router;
