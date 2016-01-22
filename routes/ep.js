var express     = require('express');
var router      = express.Router();
var _           = require('lodash');
var problems    = require('../models/problems');
var Busboy      = require('busboy');
var fs          = require('fs');
var fse         = require('fs-extra')
var uuid        = require('node-uuid');
var mime        = require('mime-types');
var entities    = require("entities");
var path        = require("path");


router.get('/', function(req, res, next) {

    res.render('ep', {
        title: "editproblem | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        _: _
    });

});


router.get('/new', function(req, res, next) {

    res.render('epN', {
        title: "editproblem | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        _: _
    });


});


router.get('/:pid/1', function(req, res, next) {


    problems.findById(req.params.pid,function(err,row){

        if( err ) { return next(new Error(err)); }

        if( row.length == 0 ) { return next(new Error('what you r looking for!')); }
        //if( row[0].status == 'incomplete' ) { return next(new Error('what you r looking for!!!')); }

        res.render('ep1', {
            title: "editproblem | JUST Online Judge",
            locals: req.app.locals,
            isLoggedIn: req.isAuthenticated(),
            user: req.user,
            _: _,
            data: problems.decodeToHTML(row[0])
        });

    });


});


router.get('/:pid/2', function(req, res, next) {

        problems.findTC('test_cases',{
            where:{
                pid: req.params.pid
            }
        },function(err,row){
            if( err ) { return next(new Error(err)); }

            res.render('ep2', {
                title: "editproblem | JUST Online Judge",
                locals: req.app.locals,
                isLoggedIn: req.isAuthenticated(),
                user: req.user,
                _: _,
                pid: req.params.pid,
                data: row
            });

        });

});



router.get('/:pid/3', function(req, res, next) {

    res.render('ep3', {
        title: "editproblem | JUST Online Judge",
        locals: req.app.locals,
        isLoggedIn: req.isAuthenticated(),
        user: req.user,
        _: _
    });
});




router.post('/', function(req, res, next) {
    res.redirect('/ep');
});


router.post('/new/', function(req, res, next) {

    if( req.body ) {

        var inserts = {
            name: entities.encodeHTML(req.body.name),
            status: 'incomplete',
            input: entities.encodeHTML(req.body.input),
            output: entities.encodeHTML(req.body.output),
            author: entities.encodeHTML(req.body.author),
            statement: entities.encodeHTML(req.body.statement)
        };


        problems.insert('problems',inserts, function(err,row){

            if( err ) { return next(new Error(err)); }

            res.redirect('/ep/' + row.insertId + '/2');

        });

    }else{
        res.end('REQUEST BODY NOT FOUND');
    }


});


router.post('/rtc/', function(req, res, next) {

    var pid=req.body.pid;
    var casename=req.body.casename;

    if( !req.body.pid || !req.body.casename ){
        return next(new Error('No such body found'));
    }

    problems.findTC('test_cases',{
        where:{
            $and:{
                pid: pid,
                name: casename
            }
        }
    },function(err,row){
        if( err ) { return next(new Error(err)); }

        if( row.length == 0 ) { return next(new Error('No such Test Case Found')); }


        var TCDir =  path.normalize(__dirname + '/../files/tc/p/' + pid +  '/' + row[0].name);


        fse.remove(TCDir, function (err) {
            if (err) { return next(new Error('Problem Removing TC Folder')) ; }


            problems.removeTC('test_cases',{
                where:{
                    $and: {
                        pid: pid,
                        name: casename
                    }
                }
            },function(err,row){

                if( err ) { return next(new Error('Problem Removing TC DB')) ; }


                problems.findTC('test_cases',{
                    where:{
                        pid: pid
                    }
                },function(err,row){
                    if( err ) { return next(new Error(err)); }

                    //send back ajax
                    res.end(JSON.stringify(row));
                });


                //use if not use ajax
                // res.redirect('/ep/' + req.params.pid + '/2');
            });

        });

    });


});


router.post('/:pid/1', function(req, res, next) {

    if( req.body ) {

        var inserts = {
            attributes:{
                name: entities.encodeHTML(req.body.name),
                status: 'incomplete',
                timelimit: entities.encodeHTML(req.body.tl),
                memorylimit: entities.encodeHTML(req.body.ml),
                input: entities.encodeHTML(req.body.input),
                output: entities.encodeHTML(req.body.output),
                author: entities.encodeHTML(req.body.author),
                statement: entities.encodeHTML(req.body.statement)
            },
            where:{
                pid: req.params.pid
            }
        };


        problems.update('problems',inserts, function(err,row){

            if( err ) { return next(new Error( 'Problem Update Error : ' +  err)); }

            if( row.length == 0 ) { return next(new Error('something went wrong with updating! :(')); }

            res.redirect('/ep/' + req.params.pid + '/2');

        });

    }else{
        res.end('REQUEST BODY NOT FOUND');
    }


});



router.post('/:pid/2', function(req, res, next) {

    var busboy = new Busboy({ headers: req.headers });
    var uniquename =  uuid.v4();
    var namemap = ['i','o'];
    var fname = 0;


    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        var saveTo =  __dirname + '/../files/tc/p/' + req.params.pid +  '/' + uniquename + '/' + namemap[fname++] + '.' + mime.extension(mimetype);

        file.on('data', function(data) {

        });
        file.on('end', function() {

        });

        file.pipe(fse.createOutputStream(path.normalize(saveTo)));

        //  file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ' + val);
    });

    busboy.on('finish', function() {
        console.log('Test Case Upload complete!');

        problems.insertTC('test_cases',{
            name: uniquename,
            pid: req.params.pid,
            created: _.now()
        },function(err,row){

            if( err ) { return next(new Error('Porblem inserting TC: ' + err)); }



            problems.findTC('test_cases',{
                where:{
                    pid: req.params.pid
                }
            },function(err,row){
                if( err ) { return next(new Error(err)); }

                //send back ajax
                res.end(JSON.stringify(row));

            });

            //use if not use ajax
           // res.redirect('/ep/' + req.params.pid + '/2');
        });


    });

    req.pipe(busboy);

});


router.post('/:pid/tjs', function(req, res, next) {

    var busboy = new Busboy({ headers: req.headers });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        console.log('File [' + fieldname + ']: filename: ' + filename);

        file.on('data', function(data) {
            console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
        });

        file.on('end', function() {
            console.log('File [' + fieldname + '] Finished');
        });
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        console.log('Field [' + fieldname + ']: value: ' + val);
    });

    busboy.on('finish', function() {
        console.log('Done parsing form!');
        res.end('Oh yes!');
    });

    req.pipe(busboy);

});



module.exports = router;