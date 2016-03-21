var express     = require('express');
var router      = express.Router();
var fs          = require('fs');
var fse         = require('fs-extra')
var uuid        = require('node-uuid');
var mime        = require('mime-types');
var path        = require("path");
var mkdirp      = require('mkdirp');
var util = require('util');


/* GET resister page. */
router.get('/' , function(req, res, next) {



    res.render('s3', {
        title: "ADDProblems | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        imgURL: null
    });




});


router.post('/:pid/', function(req, res, next) {

    var busboy = new Busboy({ headers: req.headers });
    var uniquename =  uuid.v4();
    var namemap = ['i','o'];
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {


        var saveTo =  __dirname + '/../files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++] + '.' + mime.extension(mimetype);


        file.on('data', function(data) {

        });
        file.on('end', function() {

        });


        file.pipe(fse.createOutputStream(path.normalize(saveTo)));

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
