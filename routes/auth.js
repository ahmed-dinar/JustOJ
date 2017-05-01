
var express = require('express');
var router = express.Router();


var oauth = require("oauth").OAuth2;
var Tokens = require('csrf');
var async = require('async');
var request = require('request');
var has = require('has');
var url = require('url');

var User = require('../models/user');
var isLoggedIn = require('../middlewares/isLoggedIn');
var Secrets = require('../files/secrets/Secrets');

var debug = require('debug')('routes:auth');

var tokens = new Tokens();
var OAuth2;
var csrfToken;


router.get('/' , function(req, res, next) {
    res.end('yay!');
});


/**
 * http://uhunt.felix-halim.net/api/uname2uid/ahmed_dinar
 * http://uhunt.felix-halim.net/api/ranklist/381603/0/0
 * NOTE: ask user id and ask to change username
 */
router.get('/uva' , function(req, res, next) {
    res.end('yay!');
});



/**
 * http://codeforces.com/api/user.info?handles=Ahmed_Dinar
 * NOTE: ask to change email {random}@example.com and make public
 */
router.get('/codeforces' , function(req, res, next) {
    res.end('yay!');
});



/**
 *  oAuth2 of google
 */
router.get('/google', isLoggedIn(true), function(req, res, next) {

    if( has(req.query, 'process')  && req.query.process === 'disconnect')
         return disconnectOAuth('google+', { google_id: '' } , req, res);

    authorizeUser({
        client_id: Secrets.google.client_id,
        client_secret: Secrets.google.client_secret,
        baseUrl: '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://www.googleapis.com/oauth2/v4/token'
    } , {
        client_id: Secrets.google.client_id,
        redirect_uri: 'http://localhost:8888/auth/google/callback',
        response_type: 'code',
        scope: 'profile'
    } , req, res, next);
});



/**
 * oAuth2 of google callback
 * https://www.googleapis.com/plus/v1/people/me?access_token={access_token}
 * https://plus.google.com/u/0/id
 */
router.get('/google/callback', isLoggedIn(true), function (req, res) {

    var code = req.query.code;
    debug('google code ' + code);
    debug(req.query);

    if ( !tokens.verify(csrfToken, req.query.state) ){
        res.end('session expired or 403?');
        return;
    }

    async.waterfall([
        function (callback) {

            OAuth2.getOAuthAccessToken(code, {
                redirect_uri: 'http://localhost:8888/auth/google/callback',
                grant_type: 'authorization_code'
            }, function (err, access_token, refresh_token, results) {
                
                if(err)
                    return callback(err);
                
                debug('google callbacks: ');
                debug(results);

                callback(null,access_token);
            });
        },
        function (access_token , callback) {
            
            var profileUrl = 'https://www.googleapis.com/plus/v1/people/me?access_token=' + access_token;
            request
                .get(profileUrl , function (err, response, body) {

                    if(err)
                        return callback(err);

                    body = JSON.parse(body);
                    debug(body);

                    if( response.statusCode !== 200 )
                        return callback(body);

                    callback(null,body);
                });
        },
        function (userData, callback) {

            if( !userData.isPlusUser )
                return callback();

            User.updateProfile({
                id: req.user.id,
                fields: {
                    google_id: userData.id
                }
            } , function (err,rows) {
                if(err)
                    return callback(err);

                callback(null,userData.id);
            });
        }
    ], function (err , googleId) {

        if (err) {
            debug(err);
            req.flash('auth_error', 'failed to connect g+ account');
        }
        else if( !googleId )
            req.flash('auth_error', 'you are not a g+ user');
        else
            req.flash('auth_success', 'g+ account connected successfully');

        res.redirect('/user/settings/profile');
    });
});


/**
 *  oAuth2 of facebook
 */
router.get('/facebook' , isLoggedIn(true), function(req, res, next) {

    if( has(req.query, 'process')  && req.query.process === 'disconnect')
        return disconnectOAuth('facebook', { fb_id: '' } , req, res);

    authorizeUser({
        client_id: Secrets.facebook.app_id,
        client_secret: Secrets.facebook.app_secret,
        baseUrl: '',
        authUrl: "https://www.facebook.com/v2.9/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v2.9/oauth/access_token"
    }, {
        client_id: Secrets.facebook.app_id,
        redirect_uri: 'http://localhost:8888/auth/facebook/callback',
        response_type: 'code',
        scope: 'public_profile'
    }, req, res, next);
});


/**
 * oAuth2 of facebook callback
 * https://graph.facebook.com/v2.9/me?access_token={access_token}
 */
router.get('/facebook/callback', isLoggedIn(true), function (req, res) {

    var code = req.query.code;
    debug('facebook callbacks:');
    debug(req.query);

    if ( !tokens.verify(csrfToken, req.query.state) ){
        res.end('session expired or 403?');
        return;
    }

    async.waterfall([
        function (callback) {

            OAuth2.getOAuthAccessToken(code, {
                redirect_uri: 'http://localhost:8888/auth/facebook/callback'
            }, function (err, access_token, refresh_token, results) {
                if (err)
                    return callback(err);

                debug('facebook access infos: ');
                debug(results);

                callback(null,access_token);
            });
        },
        function (access_token , callback) {

            var profileUrl = 'https://graph.facebook.com/v2.9/me?access_token=' + access_token;
            request
                .get(profileUrl , function (err, response, body) {
                    if(err)
                        return callback(err);

                    body = JSON.parse(body);
                    debug(body);

                    if( response.statusCode !== 200 || !has(body,'id')  )
                        return callback(body);

                    callback(null,body.id);
                });
        },
        function (fbId, callback) {

            User.updateProfile({
                id: req.user.id,
                fields: {
                    fb_id: fbId
                }
            } , function (err,rows) {
                if(err)
                    return callback(err);

                callback(null,fbId);
            });
        }
    ], function (err , fbId) {

        if (err) {
            debug(err);
            req.flash('auth_error', 'failed to connect facebook account');
        }
        else
            req.flash('auth_success', 'facebook account has been  connected');

        res.redirect('/user/settings/profile');
    });
});


/**
 *  oAuth2 of linkedin
 */
router.get('/linkedin' , isLoggedIn(true), function(req, res, next) {

    if( has(req.query, 'process')  && req.query.process === 'disconnect')
        return disconnectOAuth('linkedin', { linkedin_id: '' } , req, res);

    authorizeUser({
        client_id: Secrets.linkedin.client_id,
        client_secret: Secrets.linkedin.client_secret,
        baseUrl: 'https://www.linkedin.com/',
        authUrl: 'oauth/v2/authorization',
        tokenUrl: 'oauth/v2/accessToken'
    }, {
        response_type: 'code',
        client_id: Secrets.linkedin.client_id,
        redirect_uri: 'http://localhost:8888/auth/linkedin/callback',
        scope: "r_basicprofile"
    }, req, res, next);
});


/**
 * oAuth2 of linkedin callback
 * https://api.linkedin.com/v1/people/~?oauth2_access_token={access_token}&format=json
 */
router.get('/linkedin/callback', isLoggedIn(true), function (req, res) {

    var code = req.query.code;
    debug('linkedin callbacks  ');
    debug(req.query);

    if ( !tokens.verify(csrfToken, req.query.state) ){
        res.end('session expired or 403?');
        return;
    }

    async.waterfall([
        function (callback) {

            OAuth2.getOAuthAccessToken(code, {
                grant_type: 'authorization_code',
                redirect_uri: 'http://localhost:8888/auth/linkedin/callback'
            }, function (err, access_token, refresh_token, results) {
                if (err)
                    return callback(err);

                debug('linkedin access info: ');
                debug(results);

                callback(null,access_token);
            });
        },
        function (access_token , callback) {

            var profileUrl = 'https://api.linkedin.com/v1/people/~?format=json&oauth2_access_token=' + access_token;
            request
                .get(profileUrl , function (err, response, body) {
                    if(err)
                        return callback(err);

                    body = JSON.parse(body);
                    debug(body);

                    if( response.statusCode !== 200 || !has(body,'siteStandardProfileRequest')  )
                        return callback(body);

                    var profileUrl = body.siteStandardProfileRequest.url;
                    var linkedinId = url.parse(profileUrl,true).query.id;

                    callback(null,linkedinId);
                });
        },
        function (linkedinId, callback) {

            User.updateProfile({
                id: req.user.id,
                fields: {
                    linkedin_id: linkedinId
                }
            } , function (err,rows) {
                if(err)
                    return callback(err);

                callback(null,linkedinId);
            });
        }
    ], function (err , fbId) {

        if (err) {
            debug(err);
            req.flash('auth_error', 'failed to connect linkedin account');
        }
        else
            req.flash('auth_success', 'linkedin account has been  connected');

        res.redirect('/user/settings/profile');
    });
});


/**
 *  oAuth2 of github
 */
router.get('/github' , isLoggedIn(true), function(req, res, next) {

    if( has(req.query, 'process')  && req.query.process === 'disconnect')
        return disconnectOAuth('github', { github_token: '' } , req, res);

    authorizeUser({
        client_id: Secrets.github.client_id,
        client_secret: Secrets.github.client_secret,
        baseUrl: 'https://github.com/',
        authUrl: 'login/oauth/authorize',
        tokenUrl: 'login/oauth/access_token'
    }, {
        redirect_uri: 'http://localhost:8888/auth/github/callback',
        scope: 'user'
    }, req, res, next);
});


/**
 * oAuth2 of github callback
 * https://api.github.com/user?access_token={access_token}
 */
router.get('/github/callback', isLoggedIn(true), function (req, res) {

    var code = req.query.code;
    debug('github callbacks ');
    debug(req.query);

    if ( !tokens.verify(csrfToken, req.query.state) ){
        res.end('session expired or 403?');
        return;
    }

    OAuth2.getOAuthAccessToken(code, {}, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error github accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('github access info: ');
        debug(results);

        res.redirect('https://api.github.com/user?access_token=' + access_token);
    });
});



/**
 * oAuth2 of stackexchange
 */
router.get('/stackexchange' , isLoggedIn(true), function(req, res, next) {

    if( has(req.query, 'process')  && req.query.process === 'disconnect')
        return disconnectOAuth('stackoverflow', { stack_token: '' } , req, res);

    authorizeUser({
        client_id: Secrets.stackexchange.client_id,
        client_secret: Secrets.stackexchange.client_secret,
        baseUrl: 'https://stackexchange.com/',
        authUrl: 'oauth',
        tokenUrl: 'oauth/access_token'
    }, {
        redirect_uri: 'http://localhost:8888/auth/stackexchange/callback',
        scope: "read_inbox,no_expiry",
        client_id: Secrets.stackexchange.client_id
    }, req, res, next);
});


/**
 * oAuth2 of stackexchange callback
 * https://api.stackexchange.com/2.2/me?site=stackoverflow&key={key}&access_token={access_token}
 */
router.get('/stackexchange/callback', isLoggedIn(true), function (req, res) {

    var code = req.query.code;
    debug('stackexchange callbacks ');
    debug(req.query);

    if ( !tokens.verify(csrfToken, req.query.state) ){
        res.end('session expired or 403?');
        return;
    }

    OAuth2.getOAuthAccessToken(code, {
        redirect_uri: 'http://localhost:8888/auth/stackexchange/callback'
    }, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error stackexchange accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('stackexchange access info: ');
        debug(results);

        res.redirect('https://api.stackexchange.com/2.2/me?site=stackoverflow&key=' + Secrets.stackexchange.key + '&access_token=' + access_token);
    });
});



/**
 *
 * @param oAuthOptions
 * @param authOptions
 * @param req
 * @param res
 * @param next
 */
var authorizeUser = function (oAuthOptions, authOptions , req, res, next) {

    tokens.secret(function (err, sec) {
        if (err)
            return next(new Error(err));

        csrfToken = sec;
        var token = tokens.create(sec);

        debug('secret_csrf: ' + csrfToken);
        debug('public_csrf: ' + token);

        OAuth2 = new oauth(
            oAuthOptions.client_id,
            oAuthOptions.client_secret,
            oAuthOptions.baseUrl,
            oAuthOptions.authUrl,
            oAuthOptions.tokenUrl
        );

        authOptions['state'] =  token;
        res.redirect( OAuth2.getAuthorizeUrl(authOptions) );
    });
};


/**
 *
 * @param accountType
 * @param fields
 * @param req
 * @param res
 */
var disconnectOAuth = function (accountType, fields, req, res) {

    User.updateProfile({
        id: req.user.id,
        fields: fields
    } , function (err,rows) {
        if(err)
            req.flash('auth_error', 'failed to disconnect ' + accountType  + ' account');
        else
            req.flash('auth_success', accountType + ' account disconnected successfully');

        res.redirect('/user/settings/profile');
    });
};



module.exports = router;