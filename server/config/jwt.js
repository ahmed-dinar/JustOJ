'use strict';

var uniqid = require('uniqid');

var configObj = {

  options: function(){

    return {
      algorithm: 'HS256',
      expiresIn: 60*60,
      issuer: 'https://justoj.com/api/',
      jwtid: uniqid(),
      subject: 'Auth',
      header: {
        typ: 'JWT'
      }
    };
  }
};

module.exports = configObj;