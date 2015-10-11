var express = require('express');
var Recaptcha = require('recaptcha').Recaptcha;
var router = express.Router();

//recapctcha keys
var SITE_KEY  = '6LfADw4TAAAAADvBjKLdmd_tuxnFteqwA5WC6eLH';
var SECRET_KEY = '6LfADw4TAAAAAIIN_0gvzzAW4bW0RCS7JUAwz239';



/* GET resister page. */
router.get('/', function(req, res, next) {

    var recaptcha = new Recaptcha(SITE_KEY, SECRET_KEY);

    res.render('resister', {
        layout: true,
        recaptcha_form: recaptcha.toHTML()
    });
});

module.exports = router;
