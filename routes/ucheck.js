'use strict';

var express = require('express');
var router = express.Router();


var User = require('../models/user');


router.get('/', function(req, res, next) {
    res.status(404).send('Page Not found');
});


router.post('/', function(req, res){

    var username = req.body.username;
    var email = req.body.email;

    User.available(username,email,function(err,rows){
        if( err ){
            res.send(true);
        }else if(rows.length){
            res.send(false);
        }
        else{
            res.send(true);
        }
    });
});



module.exports = router;
