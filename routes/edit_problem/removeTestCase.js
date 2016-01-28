var Problems    = require('../../models/problems');
var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var fse         = require('fs-extra');
var path        = require("path");
var entities    = require("entities");

module.exports = function(req, res, next) {

    var pid=req.body.pid;
    var casename=req.body.casename;

    if( !req.body.pid || !req.body.casename ){
        return next(new Error('No such body found'));
    }

    Problems.findTC('test_cases',{
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


            Problems.removeTC('test_cases',{
                where:{
                    $and: {
                        pid: pid,
                        name: casename
                    }
                }
            },function(err,row){

                if( err ) { return next(new Error('Problem Removing TC DB')) ; }


                Problems.findTC('test_cases',{
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


};