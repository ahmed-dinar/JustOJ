var express     = require('express');
var router      = express.Router();

var DB          = require('../config/database/knex/DB');
var Query       = require('../config/database/knex/query');


router.get('/', function(req, res, next) {
    res.status(404).send('Page Not found');
});


router.post('/', function(req, res){

    var username = req.body.username;
    var email = req.body.email;

    if( username ){

        var sql = Query.select('username').from('users').where({ 'username': username }).limit(1);

        DB.execute(
            sql.toString()
            ,function(err,rows){
                if( err || rows.length ){
                    res.send(false);
                }else{
                    res.send(true);
                }
            });

    }else if( email ){

        var sql = Query.select('email').from('users').where({ 'email': email }).limit(1);

        DB.execute(
            sql.toString()
            ,function(err,rows){
                if( err || rows.length ){
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
