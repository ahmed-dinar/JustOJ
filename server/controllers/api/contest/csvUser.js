'use strict';

var crypto = require('crypto');
var multer = require('multer');
var logger = require('winston');
var has = require('has');
var async = require('async');
var path = require('path');
var fs = require('fs');
var csvtojson = require('csvtojson');
var uniqid = require('uniqid');
var Hashids = require('hashids');
var entities = require('entities');

var ContestValidator = appRequire('lib/validators/contest');
var ContestModel = appRequire('models/contest');
var UserModel = appRequire('models/user');
var AppError = appRequire('lib/custom-error');

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
    fields: 3,         //random , prefix and suffix
    parts: 4,
    fileSize: 15000    // 15KB (in bytes)
  },
  preservePath: true
}).single('csv');




module.exports = function(req, res, cid){

  async.waterfall([
    function saveCsv(callback){
      csvUpload(req, res, function (err) {
        if (err) {
          return callback(err);
        }

        if( !has(req,'file') || !req.file ){
          return callback(new AppError('csv file Required','INVALID_INPUT'));
        }

        logger.debug(req.file);
        logger.debug(req.body);

        if( !has(req.body,'random') ){
          req.body.random = true;
        }
        else{
          req.body.random = req.body.random == 'true';
        }

        logger.debug(typeof req.body.random);

        if( !req.body.random ){
          return validateBody(req, callback);
        }

        return callback();
      });
    },
    function validate(callback){
      new ContestValidator(cid)
        .isEnded()
        .then(function(result){
          if(result){
            return callback(new AppError('Contest Ended','CONTEST_ENDED'));
          }
          return callback();
        })
        .catch(callback);
    },
    function(callback){

      var csvdata = [];
      var rowLimit = false;
      var hasError = null;

      csvtojson({
        headers: ['name','institute'],
        maxRowLength: 360,
        checkColumn: true,
        noheader: false
      })
        .fromFile(req.file.path)
        .on('json', function(jsonObj){
          if(rowLimit || hasError){
            return;
          }
          if( csvdata.length > 150 ){
            rowLimit = true;
            return;
          }

          if( jsonObj.name.length > 250 ){
            hasError = 'name may not be greater than 250 characters.';
            return;
          }

          if( jsonObj.institute.length > 100 ){
            hasError = 'institute may not be greater than 100 characters. (in row ' + (csvdata.length + 1) + ')';
            logger.debug(jsonObj);
            return;
          }

          csvdata.push(jsonObj);
        })
        .on('done', function(error){
          if(error){
            logger.debug('csv parse error: ');
            return callback(error);
          }

          if( rowLimit ){
            return callback(new AppError('Data row limit exceeded','ROW_LIMIT'));
          }

          if( hasError ){
            return callback(new AppError(hasError, 'INVALID_INPUT'));
          }

          return callback(null, csvdata);
        });
    },
    function(csvdata, callback){

     // logger.debug(csvdata);

      var indx = req.body.random ? 0 : parseInt(req.body.suffix) - 1;
      var hashids = new Hashids('the contest is ' + cid, 10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_');

      async.eachSeries(csvdata, function(participant, cb){
        ++indx;

        participant.username = req.body.random
          ? hashids.encode(indx) + uniqid()
          : req.body.prefix + '_' + indx.toString();

        logger.debug(participant);

        return saveParticipant(cid, participant, req.body.random ? hashids : null, cb);
      }, callback);
    }
  ],
  function(error, result){
    if( !has(req,'file') || !has(req.file,'path') || !req.file.path ){
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


//
//
//
function saveParticipant(cid, participant, hashids, fn){

  async.waterfall([
    function(callback){
      ContestModel.insertUser(cid, {
        username: participant.username,
        name: entities.encodeHTML(participant.name),
        institute: entities.encodeHTML(participant.institute),
        password: null,
        website : '',
        role: 'gen'
      }, callback);
    },
    function(insertId, callback){
      return !hashids
        ? callback()
        : UserModel.put(insertId,{ username: hashids.encode(insertId) }, callback);
    }
  ], fn);
}





//
// validate body
//
function validateBody(req, fn){

  req
    .checkBody('prefix', 'Invalid prefix')
    .notEmpty().withMessage('Prefix required')
    .isLength({ min: 4, max: 20 }).withMessage('Prefix may contain 4 to 20 characters.')
    .isUsername().withMessage('Prefix may contain alpha-numeric characters and underscores.');

  req
    .checkBody('suffix', 'Invalid suffix.')
    .notEmpty().withMessage('Suffix required')
    .isNumeric().withMessage('Suffix may only contain numeric characters.')
    .isInt({ min: 1, max: 1000 }).withMessage('suffix must be between 1 and 1000.');


  async.waterfall([
    function(callback){
      req
        .getValidationResult()
        .then(function(result) {

          if (!result.isEmpty()){
            var e = result.array()[0];
            logger.debug('validation error: ', e);
            return callback(new AppError(e.msg, 'INVALID_INPUT'));
          }

          return callback();
        });
    },
    function(callback){

      UserModel.findMatch(['id'], {
        column: 'username',
        pattern: req.body.prefix + '%'
      },
      function(err, rows){
        if(err){
          return callback(err);
        }
        if( rows.length ){
          return callback(new AppError('username exists with prefix "'+ req.body.prefix +'"', 'INVALID_INPUT'));
        }
        return callback();
      });
    }
  ], fn);
}


//
//
//
function handleError(error, res){
  if(!error){
    return res.sendStatus(200);
  }

  if(error.name === 'NOT_FOUND'){
    return res.status(404).json({ error: error.message });
  }

  if(error.err === 'column_mismatched'){
    return res.status(400).json({ error: error.message });
  }

  if(
    error.name === 'INVALID_INPUT'
    || error.name === 'CONTEST_ENDED'
    || error.name === 'ROW_LIMIT'
    || error.err === 'column_mismatched'
  ){
    return res.status(400).json({ error: error.message });
  }

  if( has(uploadErrors, error.code) ){
    return res.status(400).json({ error: uploadErrors[error.code] });
  }

  // logger.error(error);
  return res.sendStatus(500);
}