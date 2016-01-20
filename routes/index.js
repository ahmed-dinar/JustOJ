var express     = require('express');
var User        = require('../models/user');
var router      = express.Router();



/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('index',{
        isUser: req.isAuthenticated(),
        user: req.user
    });
});

function showResult(err,result){
    if(err){
        console.log('error');
        console.log(err);
    }
    else{
        console.log(result.length);
        console.log(result);
    }
}

module.exports = router;
