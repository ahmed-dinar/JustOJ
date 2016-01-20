

var orm = require('../config/database/orm');

var table = 'problems';

exports.findById = function (pid,callback) {

    orm.in(table).findAll({
        where:{
            pid: pid
        }
    },function(err,rows){
        callback(err,rows);
    });

};

exports.insert = function(){




};


