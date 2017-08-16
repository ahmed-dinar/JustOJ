'use strict';

var crypto = require('crypto');
var multer = require('multer');
var logger = require('winston');
var has = require('has');
var async = require('async');
var path = require('path');
var fs = require('fs');

var AppError = appRequire('lib/custom-error');


//
// Generae a unique safe file name
//
function uniqueFileName(req, file, cb) {
  crypto.randomBytes(16, function(err, buffer) {
    if(err){
      return cb(err);
    }
    return cb(null, buffer.toString('hex') + (path.extname(file.originalname) || '.txt'));
  });
}


//
// validate file before save
//
function fileFilter(req, file, cb){
  logger.debug('fileFilter = ',file);

  if(
    (file.mimetype.indexOf('text/plain') < 0 && file.mimetype.indexOf('text/csv') < 0)
    || ( path.extname(file.originalname) !== '.csv' )
  ){
    return cb(new AppError('Valid csv file required','INVALID_INPUT'));
  }

  return cb(null, true);
}


var csvUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'files', 'uploads'),
    filename: uniqueFileName
  }),
  fileFilter: fileFilter,
  limits:{
    files: 1,          //only csv
    fields: 2,         //prefix and suffix
    parts: 3,          //source and language
    fileSize: 15000    // 15KB (in bytes)
  },
  preservePath: true
}).single('csv');


module.exports = function(req, res){

  async.waterfall([
    function(callback){
      csvUpload(req, res, function (err) {
        if (err) {
          return callback(err);
        }

        if( !has(req,'file') || !req.file ){
          return callback(new AppError('csv file Required','INVALID_INPUT'));
        }

        logger.debug(req.file);
        logger.debug(req.body);

        return callback();
      });
    }
  ],
  function(error, result){
    if( !has(req,'file') ){
      return handleError(error, res);
    }

    fs.unlink(req.file.path, function(err){
      if(err){
        logger.error(err);
      }
      return handleError(error, res);
    });
  });
};


function handleError(error, res){
  if(!error){
    return res.sendStatus(200);
  }

  logger.debug(error);

  if(error.name === '404'){
    return res.status(404).json({ error: error.message });
  }

  if(error.name === 'INVALID_INPUT'){
    return res.status(400).json({ error: error.message });
  }

  var uploadErrors = {
    'LIMIT_PART_COUNT': 'Too many parts',
    'LIMIT_FILE_SIZE': 'File size limit exceeded',
    'LIMIT_FILE_COUNT': 'Only one source allowed',
    'LIMIT_FIELD_KEY': 'Field name too long',
    'LIMIT_FIELD_VALUE': 'Field value too long',
    'LIMIT_FIELD_COUNT': 'Too many fields',
    'LIMIT_UNEXPECTED_FILE': 'Unexpected file',
    'LIMIT_UNEXPECTED_FILE': 'Unexpected file',
  };

  if( has(uploadErrors, error.code) ){
    return res.status(400).json({ error: uploadErrors[error.code] });
  }

  // logger.error(error);
  return res.sendStatus(500);
}