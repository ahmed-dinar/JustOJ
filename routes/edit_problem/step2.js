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
        var saveTo = path.normalize(process.cwd() + '/files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++] + path.extname(filename));
        file.pipe(fse.createOutputStream(saveTo));
    });

    busboy.on('finish', function() {
      console.log('Test Case Upload complete!');

      async.waterfall([
        function(callback) {
            insertTestCase(req.params.pid,uniquename,callback);
        },
        function(callback){
           reloadTestCases(req.params.pid,callback)
        }
      ], function (error, row) {
          if( error ) { return next(error); }
          else {
              res.end(row);
          }
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
      if( err ) { return callback(new Error('Porblem inserting TC: ')); }

      callback(null);
  });
};


var  reloadTestCases = function(pid,callback){
  Problems.findTC('test_cases',{
    where:{
      pid: pid
    }
  },function(err,row){
    if( err ) { return callback(new Error(err)); }

    callback(null,JSON.stringify(row));
  });
};
