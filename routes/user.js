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

        var solvedList =  [];
        if( submissionHistory.length && submissionHistory[0].solvedList )
            solvedList = JSON.parse('[' + submissionHistory[0].solvedList + ']');

        submissionHistory = submissionHistory.length ? submissionHistory[0] : { solved: 0, accepted: 0, re: 0, tle: 0, mle: 0, ce: 0, wa: 0, totalSubmission: 0 };

        var profile =  {
            contestHistory: contestHistory,
            userData: userData,
            submissionHistory: submissionHistory,
            solvedList: solvedList
        };

        console.log(profile);

        res.render('user/profile',{
            active_nav: "",
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            username: username,
            profile: profile
        });
    });
});


module.exports = router;
