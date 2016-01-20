/**
 *
 * @type {exports|module.exports}
 */

var db          = require('../config/database/database');
var orm         = require('../config/database/orm');
var bcrypt      = require('bcryptjs');
var _           = require('lodash');
var moment      = require("moment");
var uuid        = require('node-uuid');
var nodemailer  = require('nodemailer');
var async       = require('async');


/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.resister = function (req, res, next) {

    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;

    async.waterfall([

        function(callback) {

            if (username && password && email) {
                bcrypt.genSalt(10, function (err, salt) {

                    if (err) { return callback('salt error', null); }

                    bcrypt.hash(password, salt, function (err, hash) {

                        if (err) { return callback('hash error', null); }

                        var token = uuid.v4();
                        var now = _.now();
                        var created = moment(now).format("YYYY-MM-DD HH:mm:ss");
                        var expire = moment(now).add(24, 'hours').format("YYYY-MM-DD HH:mm:ss");


                        orm.in('temp_user').insert({
                            username: username,
                            password: hash,
                            email   : email,
                            created : created,
                            expire  : expire,
                            token   : token
                        },function(err,rows){

                            if (err) { return callback('insert error', null); }

                            callback(null, token);

                        });


                    });
                });

            } else {
                callback('form error', null);
            }

        },

        function(token, callback) {

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'testjudge.me@gmail.com ',
                    pass: 'just115599'
                }
            });

            var link = "http://" + req.get('host') + "/verify?verification=" + token;
            var html = "Hello," + username + "<br><br>Please Click on the link to verify your email.<br><br>"
                + "<a href=\"" + link + "\">" + link + "</a><br><br>Thank you,<br>JUSTOJ";

            var mailOptions = {
                to: email,
                subject: 'Email verification of resistration',
                text: 'hello world!',
                html: html
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {

                    //delete previous inserted row*******************

                    return callback('send mail error' + error, null);
                }

                callback(null, true);

            });

        }


    ], function (err, result) {

        if (err) {
            req.flash('resFailure', err);
            res.redirect('/resister');
        } else {
            req.flash('success', 'Successfully resisterd! A varification link sent to your mail.Please follow the link to activate account in 24 hours.');
            res.redirect('/login');
        }

    });

};


/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.verify = function (req, res, next) {

    var thishost      = "http://localhost:8888";
    var requestedhost = req.protocol + "://" + req.get('host');

    if( thishost === requestedhost ){
        var token = req.query.verification;

        if(token){

            async.waterfall([


                //find the token
                function(callback) {


                    orm.in('temp_user').findAll({
                        attributes: ['username','password','email'],
                        where:{
                            token: token
                        }
                    },function(err,rows){

                        if( err ){ return callback(err,null);  }

                        if( rows.length > 0 ) {
                            return callback(null,rows[0]);
                        }

                         callback('Expired or invalid token',null);

                    });


                },


                //insert vafied user to main database
                function (rows,callback) {

                    orm.in('users').insert({
                        username : rows.username,
                        password : rows.password,
                        email    : rows.email,
                        joined   : moment(_.now()).format("YYYY-MM-DD HH:mm:ss")

                    },function(err,rows){

                        if (err) { return callback('insert error', null); }

                        callback(null);

                    });

                },


                //delete temp user
                function (callback) {

                    orm.in('temp_user').delete({
                        where:{
                            token: token
                        }
                    }, function (err,rows) {

                        if (err) { return callback('delete temp-user error', null); }

                        callback(null,true);

                    });
                }
                

            ], function (err, result) {

                if(err){
                    res.status(404).send(err);
                }
                else {
                    req.flash('success', 'Email verified,You can login now!');
                    res.redirect('/login');
                }

            });


        }else{
            res.status(404).send('Page Not found');
        }

    }else{
        res.status(404).send('Page Not found');
    }

};
