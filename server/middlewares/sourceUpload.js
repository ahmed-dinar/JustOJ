'use strict';

var crypto = require('crypto');
var multer = require('multer');
var path = require('path');

//should be handle by environment varible?
var UPLOAD_DIR = path.join(process.cwd(), '..', 'judger', 'source');
var COMMON_EXTENSION = '.txt';


//
// Generae a unique safe file name
//
function uniqueFileName(req, file, cb) {
  crypto.randomBytes(16, function(err, buffer) {
    if(err){
      return cb(err);
    }
    return cb(null, buffer.toString('hex') + COMMON_EXTENSION);
  });
}


//
// source file handler
//
var storage = multer.diskStorage({
  destination: UPLOAD_DIR,
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