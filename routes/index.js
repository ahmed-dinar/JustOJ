/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express = require('express');
var router = express.Router();

var gravatar = require('gravatar');

router.get('/',function(req, res, next) {

    console.log(req.user);

    if(req.isAuthenticated()){
    var pro = gravatar.url(req.user.email, {s: '20'}, true);
    console.log(pro);}
    res.render('index',{
        active_nav: '',
        isLoggedIn: req.isAuthenticated(),
        user: req.user
    });
});


module.exports = router;
