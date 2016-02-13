/**
 *
 * @param table
 * @returns {exports}
 */


var Query         = require('../config/database/query');
var Pagination  = require('../helpers/pagination').Pagination;


exports.findAll = function(table,cur_page,limit,callback) {

    Query.in(table).countAll(function (err, rows) {

        var total_count = 0;

        if( err ) { return callback(err,null,null); }

        if( rows.length > 0 ) {
            total_count =  rows[0]['COUNT(*)'];
        }
        else{
            console.log('oi bal');
        }


        var pagination = new Pagination(cur_page,limit,total_count);

        Query.in(table).findAll({
            limit: pagination.page_limit,
            offset: pagination.offset()
        },function(err,results){

            if( err ) { return callback(err,null,null); }

            callback(null,results,pagination);
        });

    });

};
