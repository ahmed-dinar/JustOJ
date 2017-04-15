/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var router      = express.Router();

var roles       = require('../middlewares/userrole');


router.get('/',function(req, res, next) {




    res.render('index',{
        active_nav: "",
        isLoggedIn: req.isAuthenticated(),
        user: req.user
    });
});


module.exports = router;
