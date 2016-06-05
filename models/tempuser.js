/**
 *
 * @type {exports|module.exports}
 */


var bcrypt      = require('bcryptjs');
var _           = require('lodash');
var moment      = require("moment");
var uuid        = require('node-uuid');
var nodemailer  = require('nodemailer');
var async       = require('async');

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');

var Secrets     = require('../files/secrets/Secrets');

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.resister = function (req, cb) {

    var username = req.body.username;
    var name = req.body.name;
    var password = req.body.password;
    var email    = req.body.email;
    var role     = 'user';

    async.waterfall([

        function(callback) {
            bcrypt.genSalt(10, function (err, salt) {
                if (err) { return callback('salt error');}

                callback(null, salt);
            });
        },
        function(salt,callback) {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) { return callback('hash error'); }

                callback(null, hash);
            });
        },
        function(hash,callback) {

            var token = uuid.v4();
            var now = _.now();
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

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if (err) { return callback('insert temp user error', null); }

                    callback(null, token);
                });
        },

        function(token, callback) {

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: Secrets.gmail.username,
                    pass: Secrets.gmail.password
                }
            });

            var link = "http://" + req.get('host') + "/verify?verification=" + token;
            var html = "Hello," + username + "<br><br>Please Follow the link to verify your email.<br><br>"
                + "<a href=\"" + link + "\">" + link + "</a><br><br>Thank you,<br>JUSTOJ";

            var mailOptions = {
                to: email,
                subject: 'Email verification of resistration',
                text: 'hello world!',
                html: html
            };

            transporter.sendMail(mailOptions, function (error, info) {

                if (error) {
                    console.log('send mail error::');
                    console.log(error);
                    return callback('Error resistration');
                }

                callback();
            });
        }


    ], cb);

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

    if( thishost !== requestedhost ){ return next(new Error('Page Not Found')); }

    var token = req.query.verification;

    if(!token){ return next(new Error('Page Not Found')); }

    async.waterfall([

        function(callback) {

            var sql = Query.select(['name','username','password','email','role'])
                .from('temp_user')
                .where({ 'token': token })
                .limit(1);

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if( err ){ return callback(err);  }

                    if( rows.length ) { return callback(null,rows[0]); }

                    callback('Expired or invalid token');
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

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if (err) { return callback('insert user error', null); }

                    callback();
                });

        },

        function (callback) {

            var sql = Query('temp_user').where({ 'token': token }).del();

            DB.execute(
                sql.toString()
                ,function(err,rows){
                    if (err) { return callback('delete temp-user error', null); }

                    callback();
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
};
