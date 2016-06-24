/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var router      = express.Router();

router.get('/',function(req, res, next) {
    res.status(404)        // HTTP status 404: NotFound
        .send('Not found');
});

router.get('/:username',function(req, res, next) {

    var username = req.params.username;

    res.render('user/profile',{
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        username: username
    });

});


module.exports = router;
