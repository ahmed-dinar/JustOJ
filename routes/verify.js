var express = require('express');
var router = express.Router();

var TempUser = require('../models/tempuser');

router.get('/', function(req, res, next) {
    TempUser.verify(req,res,next);
});


module.exports = router;
