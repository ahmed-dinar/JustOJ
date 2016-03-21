var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var fs          = require('fs');
var path        = require("path");
var async       = require('async');
var rimraf      = require('rimraf');

module.exports = function(req,res,next){
  var module = {};

  module.get = function(){

    async.waterfall([
      function(callback) {

            var attr = ['id'];
            Problems.findById(req.params.pid,attr,function(err,row){

                if( err ) { return callback(err); }

                if( row.length == 0 ) { return callback('what you r looking for!'); }
                //if( row[0].status == 'incomplete' ) { return callback(new Error('what you r looking for!!!')); }

                callback();

            });

      },
      function(callback){

          var rootDir = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid);
          fs.readdir(rootDir, function(err, files) {

              var empty = [];
              if( err ){

                  if( err.code === 'ENOENT' ){
                      return callback(null,empty);
                  }

                  console.log('getTestCases error:: ');
                  console.log(err);
                  return callback('getTestCases error');
              }

              if(files){
                  return callback(null,files);
              }

              callback(null,empty);

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
          pid: req.params.pid,
          successMsg: req.flash('tcUpSuccess'),
          errMsg: req.flash('tcUpErr'),
          rsuccessMsg:  req.flash('tcRemSuccess'),
          rerrMsg:  req.flash('tcRemErr'),
          data: row
        });

    });


  };

  module.post = function(){


    var busboy = new Busboy({ headers: req.headers });
    var uniquename =  uuid.v4();
    var namemap = ['i.txt','o.txt'];
    var noFile = 0;
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        if( noFile || !filename ){
            noFile = 1;
            file.resume();
            return;
        }

        var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++]);
        file.pipe(fse.createOutputStream(saveTo));
    });

    busboy.on('finish', function() {

        if( noFile || fname!==2 ){
            clearUpload( path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename) );
            req.flash('tcUpErr', 'Please Select File');
            res.redirect('/ep/' + req.params.pid + '/2');
            return;
        }

        req.flash('tcUpSuccess', 'Test Case added!');
        res.redirect('/ep/' + req.params.pid + '/2');

    });

    req.pipe(busboy);
  };

  return module;
};


var clearUpload = function(remDir){

    rimraf(remDir, function(error){
        if( error ){
            console.log('Clean up upload error::');
            console.log(error);
            return;
        }

        console.log('Cleaned uploaded TC');
    });
};