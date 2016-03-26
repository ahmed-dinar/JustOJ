/**
 *
 * @param table
 * @returns {exports}
 */


var Query       = require('../config/database/query');
var Pagination  = require('../helpers/pagination').Pagination;
var async       = require('async');

exports.findAll = function(opts,cb) {

    async.waterfall([
        function(callback) {
            countResults(opts,callback);
        },
        function(total_count,callback){
            findResults(opts,total_count,callback);
        }
    ], function (error, rows, pagination) {
        cb(error,rows,pagination);
    });

};



var countResults = function(opts,callback){

    Query.in(opts.table).count(opts,function (err, rows) {

        if( err ) { return callback(err); }


        var total_count = 0;

        if( rows.length ) {
            total_count =  rows[0]['COUNT(*)'];
        }
        else{
            console.log('Paginate findAll no result??');
        }

        callback(null,total_count);

    });
};



var findResults = function(opts, total_count, callback){

    var pagination = new Pagination(opts.cur_page,opts.limit,total_count);
    var obj = {
        limit: pagination.page_limit,
        offset: pagination.offset()
    };

    opts['offset'] = pagination.offset();

    Query.in(opts.table).findAll(opts,function(err,rows){

        if( err ) { return callback(err); }

        callback(null,rows,pagination);
    });
};
