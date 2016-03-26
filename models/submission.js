var Query       = require('../config/database/query');
var _           = require('lodash');
var async       = require('async');


exports.insert = function(inserts,cb){
    Query.in('submissions').insert(inserts,function(err,row){

        if( err ){ return cb(err); }

        cb(null,row.insertId);
    });
};


exports.update = function(inserts,cb){

    Query.in('submissions').update(inserts,function(err,rows){
        cb(err);
    });

};