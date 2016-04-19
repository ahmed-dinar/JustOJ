var express     = require('express');
var router      = express.Router();
var fs          = require('fs');
var fse         = require('fs-extra')
var uuid        = require('node-uuid');
var mime        = require('mime-types');
var path        = require("path");
var mkdirp      = require('mkdirp');
var util = require('util');

var Query = require('../config/database/knex/query');
var DB    = require('../config/database/knex/DB');


/* GET resister page. */
router.get('/' , function(req, res, next) {


    var sql = Query.where({
        'submissions.pid': '1',
        'submissions.status': '0'
    })
        .select(['submissions.language','submissions.submittime','submissions.cpu','submissions.memory','users.username','problems.title'])
        .from('submissions')
        .min('submissions.cpu as cpu')
        .groupBy('submissions.uid')
        .orderBy('submissions.cpu')
        .leftJoin('users', 'submissions.uid', 'users.id')
        .leftJoin('problems', 'submissions.pid', 'problems.id')
        .as('ignored_alias');




    DB.execute(
        sql.limit(20).offset(2).toString()
        ,function(err,rows){

        if(err){
            console.log(err);
            return;
        }

        console.log(rows);


        res.end(JSON.stringify(rows));

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
