'use strict';

/**
 * Module dependencies.
 */
var passportLocal = require('passport-local');
var User = require('../models/user');
var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');


module.exports = function(passport) {

    /**
     * LOCAL LOGIN
     */
    passport.use(
        'local-login',
        new passportLocal.Strategy({
            passReqToCallback : true
        },
        function(req, username, password, done){
            User.login(username,password,function(err,user){

                if (err)
                    return done(null, false, req.flash('loginFailure', err) );

                done(null, user);
            });
        }
    ));


    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });


    // used to deserialize the user
    passport.deserializeUser(function(id, done) {

        var sql = Query.select()
            .from('users')
            .where({
                'id': id
            })
            .limit(1);

        DB.execute(
            sql.toString()
            ,function(err,rows){

                if(err)
                    return done(err);

                if( !rows.length )
                    return done('404,no user');

                done(err, rows[0]);
            });
    });
};