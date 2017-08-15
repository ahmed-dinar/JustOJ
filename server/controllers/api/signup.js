'use strict';


var express = require('express');
var router = express.Router();
var async = require('async');
var Nodemailer = require('nodemailer');
var reCAPTCHA = require('recaptcha2');
var logger = require('winston');
var config = require('nconf');

var Schema = appRequire('config/validator-schema');
var AppError = appRequire('lib/custom-error');
var User = appRequire('models/user');

router.post('/', function(req, res, next) {

  logger.debug(req.body);

  async.waterfall([
    function validateInput(callback){
      req.checkBody(Schema.resistration);
      req.checkBody('username','already taken').userExists();
      req.checkBody('email','already taken').emailExists();
      req.assert('confirmPassword', 'does not match').equals(req.body.password);

      logger.debug('validatin inputs..');

      req
        .getValidationResult()
        .then(function(result) {
          if (!result.isEmpty()){
            var e = result.array()[0];
            logger.debug(e);
            return callback(new AppError(e.param + ' ' + e.msg,'input'));
          }

          return callback();
        });
    },
    function(callback) {
      var recaptcha = new reCAPTCHA({
        siteKey: config.get('recaptcha2:SITE_KEY'),
        secretKey: config.get('recaptcha2:SECRET_KEY')
      });

      logger.debug('validatin captcha..');

      recaptcha.validateRequest(req)
        .then(function(){
          return callback();
        })
        .catch(function(errorCodes){
          logger.debug(recaptcha.translateErrors(errorCodes));
          return callback(new AppError('Captcha does not match','input'));
        });
    },
    async.apply(User.save, req.body),
    async.apply(sendVarificationToken, req)
  ],
  function(err, data){
    if(err){
      if(err.name === 'input')
        return res.status(400).json({ error: err.message });

      logger.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.res.sendStatus(200);
  });
});


//
// send account confirmation token to user email
//
function sendVarificationToken(req, token, cb) {

  var transporter = Nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: config.get('mail'),
      clientId: config.get('gmail:oauth:clientId'),
      clientSecret: config.get('gmail:oauth:clientSecret'),
      refreshToken: config.get('gmail:oauth:refreshToken')
    }
  });

  var link = 'http://' + req.get('host') + '/account/verify?verification=' + token;
  var html = 'Hello,' + req.body.username + '<br><br>Please Follow the link to verify your email.<br><br>'
  + '<a href="' + link + '">' + link + '</a><br><br>Thank you,<br>JUSTOJ';

  var mailOptions = {
    to: req.body.email,
    subject: 'Email verification of resistration',
    text: 'hello world!',
    html: html
  };

  logger.debug('sending mail to '+ req.body.email +'..');

  transporter.sendMail(mailOptions, cb);
}


module.exports = router;
