var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var path        = require("path");
var async       = require('async');

module.exports = function(req,res,next){
  var module = {};

  module.get = function(){

    async.waterfall([
      function(callback) {

        Problems.findById(req.params.pid,function(err,row){

            if( err ) { return callback(new Error(err)); }

            if( row.length == 0 ) { return callback(new Error('what you r looking for!')); }
            //if( row[0].status == 'incomplete' ) { return callback(new Error('what you r looking for!!!')); }

            callback(null);

        });

      },
      function(callback){

        Problems.findTC('test_cases',{
          where:{
            pid: req.params.pid
          }
        },function(err,row){
            if( err ) { return callback(new Error(err)); }

            callback(null,row);
        });

      }
    ], function (error, row) {

        if( error ) {
            return next(error);
        }

        res.render('ep2', {
          title: "editproblem | JUST Online Judge",
          locals: req.app.locals,
          isLoggedIn: req.isAuthenticated(),
          user: req.user,
          _: _,
          pid: req.params.pid,
          data: row
        });

    });


  };

  module.post = function(){

    var busboy = new Busboy({ headers: req.headers });
    var uniquename =  uuid.v4();
    var namemap = ['i','o'];
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

      var saveTo = process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++] + path.extname(filename);

      file.pipe(fse.createOutputStream(path.normalize(saveTo)));

      //  file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('Field [' + fieldname + ']: value: ' + val);
    });

    busboy.on('finish', function() {
      console.log('Test Case Upload complete!');

      Problems.insertTC('test_cases',{
        name: uniquename,
        pid: req.params.pid,
        created: _.now()
      },function(err,row){

        if( err ) { return next(new Error('Porblem inserting TC: ' + err)); }


        Problems.findTC('test_cases',{
          where:{
            pid: req.params.pid
          }
        },function(err,row){
          if( err ) { return next(new Error(err)); }

          //send back ajax
          res.end(JSON.stringify(row));

        });

        //use if not use ajax
        // res.redirect('/ep/' + req.params.pid + '/2');
      });


    });

    req.pipe(busboy);
  };

  return module;
};
