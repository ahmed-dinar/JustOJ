'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var Busboy = require('busboy');
var uuid = require('uuid');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var async = require('async');
var logger = require('winston');

var MyUtil = require('../../lib/myutil');
var Judge = require('../../lib/problemSetter/settersJudge');


module.exports = function(req, res, next) {

  var uploadName = uuid.v4();
  var uploadFile = MyUtil.RUN_DIR + '/' + uploadName;
  var pID = req.params.pid;

  async.waterfall([
    function(callback){
      makeTempDir(uploadFile,callback);
    },
    function(callback) {
      getForm(uploadFile,req,callback);
    },
    function(opts,callback){
      fs.rename(uploadFile+'/code.txt', uploadFile+'/code.' + opts['language'], function(err){
        if(err )
          return callback(err);

        callback(null,opts);
      });
    },
    function(opts,callback){

      opts['runName'] = uploadName;
      opts['runDir'] = uploadFile;
      opts['pID'] = pID;
      opts['tcDir'] = MyUtil.TC_DIR + '/' + pID;
      opts['codeDir'] = uploadFile;

      logger.debug('calling Judge runner....'.green);

      Judge.run(opts,function(err,result){
        callback(err,result);
      });
    }
  ], function (error, runs) {

    cleanSubmit(uploadFile, function (err) {

      if( error ){
        logger.error(error);
        if( error.formError ){
          res.json(error);
        }
        else if( runs.compiler ){
          res.json(runs);
        }
        else{
          res.json({ system: error });
        }
      }else{
        logger.debug(runs);
        res.json(runs);
      }
    });
  });
};


var getForm = function(uploadFile,req,cb){

  var error = 0;
  var fstream = null;
  var limits = {};
  var opts = {};


  var busboy = new Busboy({
    headers: req.headers,
    limits:{
      files: 1,               //only user code file
      fields: 3,              //only language
      parts: 4,               //code and language
      fileSize: 50000         // (in bytes)
    }
  });


  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
    limits[fieldname] = val;
    logger.debug(('[' + fieldname + '] = ' + val).yellow);
  });


  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

    if( filename.length ){

      logger.debug((filename +' receieved with mimetype: ' + mimetype).yellow);

      fstream = fs.createWriteStream(uploadFile + '/code.txt');

      file.on('limit', function() {
        error = 2;
      });

      file.pipe(fstream);
    }else {
      error = 1;
      file.resume();
    }

  });


  busboy.on('finish', function() {

    if( error === 1 ){
      logger.debug('Submit Source Required'.red);
      return cb({ formError: 'Source Required' });
    }

    if( error === 2 ){
      logger.debug('Source Size Limit Exceeded'.red);
      return cb({ formError: 'Source Size Limit Exceeded' });
    }


    fstream.on('close', function () {

      logger.debug('fstream closed');

      if( limits['tl'] && limits['ml'] ){
        opts['language'] = limits['language'];
        opts['timeLimit'] = parseInt(parseFloat(limits['tl'])*1000);
        opts['memoryLimit'] = limits['ml'];
        return cb(null,opts);
      }

      logger.debug('Field Required'.red);
      cb({ formError: 'Time limit and Memory limit required' });
    });
  });

  req.pipe(busboy);

};


var makeTempDir = function(saveTo,cb){
  mkdirp(saveTo, function (err) {
    if (err) {
      logger.debug('OMG ' + saveTo + ' creation failed! permission denied!!');
      return cb(err);
    }
    logger.debug((saveTo + ' Created').green);
    cb();
  });
};



//clean up submitted code and run files
function cleanSubmit(codeDir, cb){
  rimraf(codeDir, function (err) {
    if( err ){
      logger.debug(err);
      return cb(err);
    }

    logger.debug('success clean submit!'.green);
    cb();
  });
}
