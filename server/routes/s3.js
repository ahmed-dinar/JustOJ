var express = require('express');
var router = express.Router();
var fs = require('fs');
var uuid = require('uuid');
var mime = require('mime-types');
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('util');
var reCAPTCHA = require('recaptcha2');

var Secrets = require('../files/secrets/Secrets');

function firstMid(req, res, next){
    console.log('I am first');
    next();
}

function secondMid(req, res, next){
    console.log('I am second');
    next();
}


router.route('/')
  .get(secondMid, firstMid, function(req, res, next){
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
    res.render('s3', {
       // SITE_KEY: Secrets.recaptcha2.SITE_KEY
    });
  })
  .post(function(req, res, next){
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
    res.end('nope');
  });


router.route('/test')
  .get(function(req, res, next){
    console.log('test');
    res.render('s3', {
       // SITE_KEY: Secrets.recaptcha2.SITE_KEY
    });
  });

/* GET resister page. 
router.get('/' , function(req, res, next) {

    //console.log(Secrets.recaptcha2.SITE_KEY);

    res.render('s3', {
       // SITE_KEY: Secrets.recaptcha2.SITE_KEY
    });
});


router.post('/' , function(req, res, next) {




/*
    var recaptcha = new reCAPTCHA({
        siteKey: Secrets.recaptcha2.SITE_KEY,
        secretKey: Secrets.recaptcha2.SECRET_KEY
    });

    recaptcha.validateRequest(req)
        .then(function(){
            res.end('yay!')
        })
        .catch(function(errorCodes){
            res.end(
               JSON.stringify(  recaptcha.translateErrors(errorCodes))
            );
        });
});*/

router.post('/:pid/', function(req, res, next) {

    var busboy = new Busboy({ headers: req.headers });
    var uniquename = uuid.v4();
    var namemap = ['i','o'];
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {


        var saveTo = __dirname + '/../files/tc/p/' + req.params.pid + '/' + uniquename + '/' + namemap[fname++] + '.' + mime.extension(mimetype);


        file.on('data', function(data) {

        });
        file.on('end', function() {

        });


        file.pipe(fs.createOutputStream(path.normalize(saveTo)));

      //  file.pipe(fs.createWriteStream(saveTo));

    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + val);
    });

    busboy.on('finish', function() {
        console.log('upload complete!');
        res.redirect('/s3');
    });

    req.pipe(busboy);

});




module.exports = router;
