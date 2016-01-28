var express     = require('express');
var router      = express.Router();
var cloudinary  = require('cloudinary');
var Busboy      = require('busboy');
var fs          = require('fs');
var fse         = require('fs-extra')
var uuid        = require('node-uuid');
var mime        = require('mime-types');
var path        = require("path");
var jsdiff      = require('diff');
var Compiler    = require('../helpers/compiler/compiler');

cloudinary.config({
    cloud_name: 'justojtest',
    api_key: '779219719618256',
    api_secret: 'h5YiiTq45IeVjRxUP3yHN_fpGDM'
});

/* GET resister page. */
router.get('/' , function(req, res, next) {

    var cname = '598a61a4-1f10-4531-825a-ca99aa623959';
    var cpath = path.normalize(__dirname + '/../files/runs/' + cname);
    var OS = 'windows';
    var language = 'cpp';

    console.log('cpath: ' + cpath);

    var compilerConfig = {
        language: 'cpp',
        timeLimit: 0,
        memoryLimit: 500
    };
    var compiler = new Compiler(OS,compilerConfig);

    compiler.compile(cpath,function(stdErr,stdOut){
        if( stdErr ){
            console.log('compiler error');
            console.log(stdErr);
        }else{
            console.log('compiled successfully');

            var inpt = "C:\\Users\\Ahmed Dinar\\Dropbox\\IdeaProjects\\justoj\\files\\runs";

            compiler.run(cpath,inpt+'\\input.txt',function(stdRunErr,stdRunOut){
                if( stdRunErr ){
                    console.log(stdRunErr);
                }else{
                    console.log('Runn successfully');


                    fs.readFile(inpt+'\\output.txt', 'utf8', function (error,data) {
                        if (error) {
                            return console.log(error);
                        }


                        var diff = jsdiff.diffChars(stdRunOut, data);

                        if( diff.length === 1 ){
                            console.log('Accepted');
                        }else{
                            console.log('Wrong Answer');
                        }

                    });

                }
            });

        }
    });



    res.render('s3', {
        title: "ADDProblems | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        imgURL: null
    });

});



router.post('/ajaxtest/', function(req, res, next) {

    var busboy = new Busboy({ headers: req.headers });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
        file.on('data', function(data) {
            console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
        });
        file.on('end', function() {
            console.log('File [' + fieldname + '] Finished');
        });
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + val);
    });

    busboy.on('finish', function() {
        console.log('Done parsing form!');
        res.end('recievd!!!!');
    });

    req.pipe(busboy);
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
