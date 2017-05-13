'use strict';

var debug = require('debug')('middlewares:isloggedIn');

/**
 *
 * @param auth
 * @returns {Function}
 */

module.exports = function isLoggedIn(auth) {

    return function isLoggedIn(req, res, next) {

        debug('checking is logged in..');

        if(req.isAuthenticated() == auth){
            debug('req.isAuthenticated() == auth');
            return next();
        }
        else{

            var ref_page;

            if( req.originalUrl === '/login' ){
                ref_page = '/login';
            }else if( req.query.redirect ){
                ref_page = req.originalUrl;
            }else{
                ref_page = '/login?redirect=' + req.originalUrl;
            }

            debug('redirecting ' + ref_page);

            res.redirect(ref_page);
        }

    };
};
