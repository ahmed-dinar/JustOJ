'use strict';

/**
 * Module dependencies.
 */
var ConnectRoles = require('connect-roles');
var logger       = require('winston');


/**
 *
 * @type {ConnectRoles}
 */
var roles = new ConnectRoles({
    failureHandler: function (req, res, action) {

        var accept = req.headers.accept || '';

        logger.debug('userrole action ' + action);

        if( req.isAuthenticated() ){
            res.status(403).send('Access Denied');
            return;
        }

        switch (req.user.role){
            case 'user':
                res.redirect('/login');
                break;
            default:
                res.status(403).send('Access Denied');
        }
    }
});



//normal users can access user page, but
//they might not be the only ones so we don't return
//false if the user isn't a moderator
roles.use('access users page', function (req) {
    if (req.user.role === 'user')
        return true;
});


//admin users can access all pages
roles.use(function (req) {
    if (req.user.role === 'admin')
        return true;
});


module.exports = roles;