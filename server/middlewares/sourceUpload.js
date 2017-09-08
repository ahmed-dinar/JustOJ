'use strict';

var crypto = require('crypto');
var multer = require('multer');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');

//should be handle by environment varible?
var UPLOAD_DIR = path.join(process.cwd(), '..', 'judger', 'source');
var COMMON_EXTENSION = '.txt';


function uploadDest(req, file, cb){
  async.waterfall([
    function(callback){
      crypto.randomBytes(16, function(err, buffer) {
        if(err){
          return callback(err);
        }
        return callback(null, path.join(UPLOAD_DIR, buffer.toString('hex')));
      });
    },
    function(destDir, callback){
      mkdirp(destDir, function(err){
        if(err){
          return callback(err);
        }
        return callback(null, destDir);
      });
    }
  ], cb);
}



//
// Generae a unique safe file name
//
function uniqueFileName(req, file, cb) {
  cb(null, 'code' + COMMON_EXTENSION);
}


//
// source file handler
//
var storage = multer.diskStorage({
  destination: uploadDest,
  filename: uniqueFileName
});


var sourceUpload = multer({
  storage: storage,
  limits:{
    files: 1,          //only user source file
    fields: 1,         //only language
    parts: 2,          //source and language
    fileSize: 50000    // 50KB (in bytes)
  },
  preservePath: true
});


module.exports = sourceUpload;