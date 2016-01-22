var express     = require('express');
var tempuser    = require('../models/tempuser');
var router      = express.Router();

router.get('/', function(req, res, next) {

    tempuser.verify(req,res,next);

});





module.exports = router;
