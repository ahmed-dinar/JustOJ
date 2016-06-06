/**
 * Created by ahmed-dinar on 6/7/16.
 */

'use strict';

module.exports = function CustomError(message, name) {
    Error.captureStackTrace(this, this.constructor);
    this.name = name;
    this.message = message;
};

require('util').inherits(module.exports, Error);
