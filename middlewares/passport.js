var passportLocal   = require('passport-local');
var User            = require('../models/user');
var Query           = require('../config/database/query');


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

                if (err) {
                    return done(null, false, req.flash('loginFailure', err) );
                }

                return done(null, user);

            });

        }
    ));


    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });



    // used to deserialize the user
    passport.deserializeUser(function(id, done) {

        Query.in('users').findAll({
            where: {
                id: id
            }
        }, function (err, rows) {

            if( err ){
                return done(err);
            }

            if( !rows.length ){
                return done(err);
            }

            done(err, rows[0]);
        });

    });

};