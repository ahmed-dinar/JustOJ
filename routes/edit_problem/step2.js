var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var path        = require("path");
var async       = require('async');
var rimraf      = require('rimraf');

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
    var namemap = ['i','o'];
    var noFile = 0;
    var fname = 0;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        if( noFile || !filename ){
            noFile = 1;
            file.resume();
            return;
        }

        var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++] + path.extname(filename));
        file.pipe(fse.createOutputStream(saveTo));
    });

    busboy.on('finish', function() {

        if( noFile ){
            clearUpload( path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename) );
            req.flash('tcUpErr', 'Please Select File');
            res.redirect('/ep/' + req.params.pid + '/2');
            return;
        }

      async.waterfall([
        function(callback) {
            insertTestCase(req.params.pid,uniquename,callback);
        }
      ], function (error, row) {
          if( error ) {
              console.log(error);
              req.flash('tcUpErr', 'Something went wrong with Database!');
          }
          else {
              req.flash('tcUpSuccess', 'Test Case added!');
          }
          res.redirect('/ep/' + req.params.pid + '/2');
      });

    });

    req.pipe(busboy);
  };

  return module;
};

var insertTestCase = function(pid,uniquename,callback){
  Problems.insertTC('test_cases',{
    name: uniquename,
    pid: pid,
    created: _.now()
  },function(err,row){
      if( err ) { return callback(err); }

      callback(null,'success');
  });
};

var clearUpload = function(remDir){

    console.log( 'Cleaning up: ' + remDir);

    rimraf(remDir, function(error){
        if( error ){ console.log(error); return; }

        console.log('Clean up upload TC');
    });
};