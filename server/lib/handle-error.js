'use strict';

var logger = require('winston');
var has = require('has');

var errorcode = {
  'BAD_REQUEST': 400,
  'UNAUTHORIZED': 401,
  'FORBIDDEN': 403,
  'NOT_FOUND': 404,
  'NOT_AVAILABLE_YET': 302
};

var uploadErrors = {
  'LIMIT_PART_COUNT': 'Too many parts',
  'LIMIT_FILE_SIZE': 'Source size limit exceeded',
  'LIMIT_FILE_COUNT': 'Only one source allowed',
  'LIMIT_FIELD_KEY': 'Field name too long',
  'LIMIT_FIELD_VALUE': 'Language value too long',
  'LIMIT_FIELD_COUNT': 'Only language allowed',
  'LIMIT_UNEXPECTED_FILE': 'Unexpected input'
};


//
// handle error and send message
//
function handleError(err, res){

  if( has(uploadErrors, err.code) ){
    return res.status(400).json({ error: uploadErrors[err.code] });
  }

  if( has(errorcode, err.name) ){
    return res.status(errorcode[err.name]).json({ error: err.message });
  }

  logger.error(err);
  return res.sendStatus(500);

  // switch (err.name) {
  //   case 'NOT_FOUND':
  //   case 'BAD_REQUEST':
  //   case 'FORBIDDEN':
  //   case 'NO_ACCESS_YET':
  //     return res.status(errorcode[err.name]).json({ error: err.message });
  //   default:
  //     logger.error(err);
  //     return res.sendStatus(500);
  // }
}


module.exports = handleError;