var express     = require('express');
var router      = express.Router();
var orm         = require('../config/database/orm');

router.get('/', function(req, res, next) {
    res.status(404).send('Page Not found');
});


router.post('/', function(req, res){

    var username = req.body.username;
    var email = req.body.email;

    if( username ){

        orm.in('users').findAll({
            attributes: ['username'],
            where:{
                username: username
            }
        },function(err,rows){

            if( err || rows.length>0 ){
                res.send(false);
            }else{
                res.send(true);
            }

        });


    }else if( email ){

        orm.in('users').findAll({
            attributes: ['email'],
            where:{
                email: email
            }
        },function(err,rows){

            if( err || rows.length>0 ){
                res.send(false);
            }else{
                res.send(true);
            }

        });

    }else{
        res.send(false);
    }

});



module.exports = router;
