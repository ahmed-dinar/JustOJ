'use strict';

module.exports = function judgeError(message, code) {
  Error.captureStackTrace(this, this.constructor);
  this.code = code;
  this.message = message;
};

require('util').inherits(module.exports, Error);