'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var router = express.Router();
//var logger = require('winston');

router.get('/',function(req, res, next) {

  res.status(200).json('hello submit api!');
});


module.exports = router;
