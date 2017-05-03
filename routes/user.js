/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express = require('express');
var router = express.Router();

var gravatar = require('gravatar');
var moment = require('moment');
var has = require('has');
var request = require('request');
var async = require('async');
var countries = require('country-data').countries;
var isEmail = require('validator').isEmail;

var User = require('../models/user');
var isLoggedIn = require('../middlewares/isLoggedIn');
var ValidationSchema = require('../config/form-validation-schema');
var CustomError = require('../helpers/custom-error');
var TempUser = require('../models/tempuser');

var debug = require('debug')('routes:user');


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

        debug(profile);

        res.render('user/profile',{
            active_nav: '',
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            username: username,
            profile: profile,
            moment: moment
        });

    });

/*
    User.getProfile(username, function (err, userData , contestHistory, submissionHistory) {
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

        debug(profile);

        res.render('user/profile',{
            active_nav: '',
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            username: username,
            profile: profile,
            moment: moment
        });
    });*/
});


/**
 *
 * @param userData
 * @param contestHistory
 * @param submissionHistory
 * @param callback
 */
function getSocialStatus(userData , contestHistory, submissionHistory, callback) {

    var access_token = userData.github_token;

    var userAgent = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36';
    var profileUrl = 'https://api.github.com/user?access_token=' + userData.github_token;

    request
        .get({
            url: profileUrl,
            headers: {
                'User-Agent': userAgent
            }
        }, function (err, response, body) {

            debug(body);

            if(err || response.statusCode !== 200)
                userData.github = [];

            body = JSON.parse(body);
            userData.github = {
                repos: body.public_repos,
                followers: body.followers
            };

            callback(null,userData , contestHistory, submissionHistory);
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
                debug(err.message.array());
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
 *
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

        submissionHistory = submissionHistory.length ? submissionHistory[0] : { solved: 0, accepted: 0, re: 0, tle: 0, mle: 0, ce: 0, wa: 0, totalSubmission: 0 };

        var profile = {
            contestHistory: contestHistory,
            userData: userData,
            submissionHistory: submissionHistory,
            solvedList: solvedList,
            profilePicture: gravatar.url(userData.email, {s: '150'}, true)
        };

        debug(profile);

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


module.exports = router;
