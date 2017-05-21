'use strict';

/**
 * Module dependencies.
 */
var has = require('has');
var bcrypt = require('bcryptjs');
var moment = require("moment");
var crypto = require('crypto');
var Nodemailer = require('nodemailer');
var async = require('async');
var config = require('nconf');
var logger = require('winston');

var DB = require('../config/database/knex/DB');
var Query = require('../config/database/knex/query');


/**
 * Resister a user temporarily for further email confirmation
 * @param req
 * @param cb
 */
exports.resister = function (req, cb) {

    var username = req.body.username;
    var name = req.body.name;
    var password = req.body.password;
    var email    = req.body.email;
    var role     = 'user';

    async.waterfall([
        function(callback) {
            bcrypt.genSalt(10, callback);
        },
        function(salt,callback) {
            bcrypt.hash(password, salt, callback);
        },
        function (hash, callback) {

            logger.debug('generating token...');
            crypto.randomBytes(20, function(err, buf) {
                if(err)
                    return callback(err);

                var token = buf.toString('hex');
                callback(null,hash,token);
            });
        },
        function(hash, token, callback) {

            var now = moment();
            var created = moment(now).format("YYYY-MM-DD HH:mm:ss");
            var expire = moment(now).add(24, 'hours').format("YYYY-MM-DD HH:mm:ss");

            var sql = Query.insert({
                username: username,
                name: name,
                password: hash,
                email   : email,
                created : created,
                expire  : expire,
                token   : token,
                role    : role
            })
                .into('temp_user');

            logger.debug('saving temp user..');

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if (err) return callback(err);

                    callback(null, token);
                });
        },
        function(token, callback) {

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

            var link = "http://" + req.get('host') + "/user/verify?verification=" + token;
            var html = "Hello," + username + "<br><br>Please Follow the link to verify your email.<br><br>"
                + "<a href=\"" + link + "\">" + link + "</a><br><br>Thank you,<br>JUSTOJ";

            var mailOptions = {
                to: email,
                subject: 'Email verification of resistration',
                text: 'hello world!',
                html: html
            };

            logger.debug('sending mail to '+ email +'..');

            transporter.sendMail(mailOptions, callback);
        }
    ], cb);
};


/**
 * Verify a user by token sent to email
 * @param token
 * @param cb
 */
exports.verify = function (token, cb) {

    async.waterfall([

        function(callback) {

            var sql = Query.select(['name','username','password','email','role'])
                .from('temp_user')
                .where('token', token)
                .limit(1);

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if( err )
                        return callback(err);

                    if( !rows.length )
                        return  callback('Expired or invalid token');

                    callback(null,rows[0]);
                });
        },
        function (rows,callback) {

            var sql = Query.insert({
                username : rows.username,
                name : rows.name,
                password : rows.password,
                email    : rows.email,
                role     : rows.role
            })
                .into('users');

            DB.execute(sql.toString(), callback);
        },
        function (ignorepls, callback) {

            var sql = Query('temp_user')
                .where('token', token)
                .del();

            DB.execute(sql.toString(),callback);
        }
    ], cb);
};
