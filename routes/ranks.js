var express     = require('express');
var user        = require('../models/user');
var router      = express.Router();



router.get('/', function(req, res, next) {

    res.render('ranks', {
        title: "JUST Online Judge - Ranks",
        isUser: req.isAuthenticated(),
        user: req.user
    });

});



module.exports = router;