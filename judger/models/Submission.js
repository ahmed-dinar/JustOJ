'use strict';

var Query = require('../config/db/query');
var DB = require('../config/db/DB');

function Submission(id){
  this.id = id;
}


Submission.prototype.find = function(columns, fn){
  var sql = (!columns || columns === undefined)
    ? Query.select()
    : Query.select(columns);

  sql = sql.from('submissions as s')
    .leftJoin('problems as p','s.pid','p.id')
    .where({ 's.id': this.id })
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};

Submission.prototype.put = function(columns, fn){
  var sql = Query('submissions')
    .update(columns)
    .where('id', this.id)
    .toString();

  DB.execute(sql, fn);
};


Submission.prototype.solved = function(pid, fn){
  var sql = Query('problems')
    .increment('solved', 1)
    .where('id', pid)
    .toString();

  DB.execute(sql, fn);
};





Submission.prototype.saveCase = function(columns, fn){
  var sql = Query.insert(columns)
    .into('submission_case')
    .toString();

  DB.execute(sql, fn);
};


module.exports = Submission;
