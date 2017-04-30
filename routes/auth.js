
var express = require('express');
var router = express.Router();

var Secrets = require('../files/secrets/Secrets');
var oauth = require("oauth").OAuth2;
var Tokens = require('csrf');

var debug = require('debug')('routes:auth');

var OAuth2;
var csrfToken;


router.get('/' , function(req, res, next) {
    res.end('yo');
});



/**
 * http://uhunt.felix-halim.net/api/uname2uid/ahmed_dinar
 * http://uhunt.felix-halim.net/api/ranklist/381603/0/0
 * NOTE: ask user id and ask to change username
 */
router.get('/uva' , function(req, res, next) {
    res.end('yo');
});



/**
 * http://codeforces.com/api/user.info?handles=Ahmed_Dinar
 * NOTE: ask to change email {random}@example.com and make public
 */
router.get('/codeforces' , function(req, res, next) {
    res.end('yo');
});



/**
 *  oAuth2 of google
 */
router.get('/google' , function(req, res, next) {

    var tokens = new Tokens();
    tokens.secret(function (err, sec) {
        if (err)
            return next(new Error(err));

        csrfToken = sec;
        var token = tokens.create(sec);

        debug('secret_csrf: ' + csrfToken);
        debug('public_csrf: ' + token);

        OAuth2 = new oauth(
            Secrets.google.client_id,
            Secrets.google.client_secret,
            "https://accounts.google.com/",
            "o/oauth2/v2/auth",
            "oauth2/v4/token"
        );

        res.writeHead(303, {
            Location: OAuth2.getAuthorizeUrl({
                client_id: Secrets.google.client_id,
                redirect_uri: 'http://localhost:8888/auth/google/callback',
                state: token,
                response_type: 'code',
                scope: 'profile'
            })
        });
        res.end();
    });
});


/**
 * oAuth2 of google callback
 * https://www.googleapis.com/plus/v1/people/me?access_token={access_token}
 * https://plus.google.com/u/0/id
 */
router.get('/google/callback',function (req, res) {

    var code = req.query.code;
    debug('google code ' + code);

    OAuth2._baseSite = 'https://www.googleapis.com/';

    OAuth2.getOAuthAccessToken(code, {
        redirect_uri: 'http://localhost:8888/auth/google/callback',
        grant_type: 'authorization_code'
    }, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error google accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('yo results: ');
        debug(results);

        debug('google accessToken: ');
        debug(access_token);

        res.redirect('/auth');
    });
});


/**
 *  oAuth2 of facebook
 *
 */
router.get('/facebook' , function(req, res, next) {

    OAuth2 = new oauth(
        Secrets.facebook.app_id,
        Secrets.facebook.app_secret,
        "https://www.facebook.com/",
        "v2.9/dialog/oauth",
        "v2.9/oauth/access_token"
    );

    oAuthState = shortid.generate();

    var authorizeUrl = OAuth2.getAuthorizeUrl({
        client_id: Secrets.facebook.app_id,
        redirect_uri: 'http://localhost:8888/auth/facebook/callback',
        state: oAuthState,
        response_type: 'code',
        scope: 'public_profile'
    });

    debug(authorizeUrl);

    res.writeHead(303, {
        Location: authorizeUrl
    });
    res.end();
});


/**
 * oAuth2 of facebook callback
 * https://graph.facebook.com/v2.9/me?access_token={access_token}
 */
router.get('/facebook/callback',function (req, res) {

    var code = req.query.code;
    debug('facebook code ' + code);

    OAuth2._baseSite = 'https://graph.facebook.com/';

    OAuth2.getOAuthAccessToken(code, {
        redirect_uri: 'http://localhost:8888/auth/facebook/callback'
    }, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error facebook accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('yo results: ');
        debug(results);

        debug('facebook accessToken: ');
        debug(access_token);

        res.redirect('/auth');
    });
});


/**
 *  oAuth2 of linkedin
 */
router.get('/linkedin' , function(req, res, next) {

    OAuth2 = new oauth(
        Secrets.linkedin.client_id,
        Secrets.linkedin.client_secret,
        "https://www.linkedin.com/",
        "oauth/v2/authorization",
        "oauth/v2/accessToken"
    );

    oAuthState = shortid.generate();
    res.writeHead(303, {
        Location: OAuth2.getAuthorizeUrl({
            response_type: 'code',
            client_id: Secrets.linkedin.client_id,
            redirect_uri: 'http://localhost:8888/auth/linkedin/callback',
            state: oAuthState,
            scope: "r_basicprofile"
        })
    });
    res.end();
});

/**
 * oAuth2 of linkedin callback
 * https://api.linkedin.com/v1/people/~?oauth2_access_token={token}&format=json
 */
router.get('/linkedin/callback',function (req, res) {

    var code = req.query.code;
    debug('linkedin code ' + code);

    OAuth2.getOAuthAccessToken(code, {
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:8888/auth/linkedin/callback'
    }, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error linkedin accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('yo results: ');
        debug(results);

        debug('linkedin accessToken: ');
        debug(access_token);

        res.redirect('/auth');
    });
});


/**
 *  oAuth2 of github
 */
router.get('/github' , function(req, res, next) {

    OAuth2 = new oauth(
        Secrets.github.client_id,
        Secrets.github.client_secret,
        "https://github.com/",
        "login/oauth/authorize",
        "login/oauth/access_token"
    );

    res.writeHead(303, {
        Location: OAuth2.getAuthorizeUrl({
            redirect_uri: 'http://localhost:8888/auth/github/callback',
            scope: "user"
        })
    });
    res.end();
});


/**
 * oAuth2 of github callback
 * https://api.github.com/user?access_token={access_token}
 */
router.get('/github/callback',function (req, res) {

    var code = req.query.code;
    debug('github code ' + code);

    OAuth2.getOAuthAccessToken(code, {}, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error github accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('yo results: ');
        debug(results);


        debug('github accessToken: ');
        debug(access_token);

        res.redirect('/auth');
    });
});



/**
 * oAuth2 of stackexchange
 */
router.get('/stackexchange' , function(req, res, next) {

    OAuth2 = new oauth(
        Secrets.stackexchange.client_id,
        Secrets.stackexchange.client_secret,
        "https://stackexchange.com/",
        "oauth",
        "oauth/access_token"
    );

    res.writeHead(303, {
        Location: OAuth2.getAuthorizeUrl({
            redirect_uri: 'http://localhost:8888/auth/stackexchange/callback',
            scope: "read_inbox,no_expiry",
            client_id: Secrets.stackexchange.client_id
        })
    });
    res.end();
});


/**
 * oAuth2 of stackexchange callback
 * https://api.stackexchange.com/2.2/me?site=stackoverflow&key={key}&access_token={access_token}
 */
router.get('/stackexchange/callback',function (req, res) {

    var code = req.query.code;
    debug('stackexchange code ' + code);

    OAuth2.getOAuthAccessToken(code, {
        redirect_uri: 'http://localhost:8888/auth/stackexchange/callback'
    }, function (err, access_token, refresh_token, results) {
        if (err) {
            debug('error stackexchange accessToken');
            debug(err);
            res.redirect('/auth');
            return;
        }

        debug('yo results: ');
        debug(results);

        debug('stackexchange accessToken: ');
        debug(access_token);

        res.redirect('/auth');
    });
});



module.exports = router;