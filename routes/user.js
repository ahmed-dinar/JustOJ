/**
 * Route for home page
 * @type {*|exports|module.exports}
 */

var express     = require('express');
var router      = express.Router();
var User        = require('../models/user');


router.get('/',function(req, res, next) {
    res.status(404)        // HTTP status 404: NotFound
        .send('Not found');
});

router.get('/:username',function(req, res, next) {

    var username = req.params.username;

    User.getProfile(username, function (err, userData , contestHistory, submissionHistory) {
        if(err) return next(new Error(err));

        console.log('userData');
        console.log(userData);
        console.log('contestHistory');
        console.log(contestHistory);
        console.log('submissionHistory');
        console.log(submissionHistory);

        var solvedList =  [];
        if( submissionHistory.length && submissionHistory[0].solvedList )
            solvedList = JSON.parse('[' + submissionHistory[0].solvedList + ']');

        console.log(solvedList);

        res.render('user/profile',{
            active_nav: "",
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            username: username
        });
    });
});


module.exports = router;
