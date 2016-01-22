var express     = require('express');
var user        = require('../models/user');
var router      = express.Router();



router.get('/' , function(req, res, next) {

    res.render('status', {
        title: "JUST Online Judge - Status",
        isUser: req.isAuthenticated(),
        user: req.user
    });

});


module.exports = router;