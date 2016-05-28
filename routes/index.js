/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var User        = require('../models/user');
var router      = express.Router();


router.get('/', function(req, res, next) {



    res.render('index',{
        isLoggedIn: req.isAuthenticated(),
        user: req.user
    });
});


module.exports = router;
