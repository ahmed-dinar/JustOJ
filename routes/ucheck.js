var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
    res.status(404).send('Page Not found');
});


router.post('/', function(req, res){

    var uname = req.body.username;
    var ret = false;

    if( uname == "dinar" ){
        res.send(false);
    }
    else{
        res.send(true);
    }

});

module.exports = router;
