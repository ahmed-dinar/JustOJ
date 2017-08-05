'use strict';

var Query = appRequire('config/database/knex/query');
var DB = appRequire('config/database/knex/DB');

function Submission(id){
  this.id = id;
  this.pid = null;
}


Problem.prototype.put = function(columns, fn){
  var sql = Query('submissions')
    .update(columns)
    .where('id', this.id)
    .toString();

  DB.execute(sql, fn);
});


Problem.prototype.find = function(columns, fn){
  var sql = (!columns || columns === undefined)
    ? Query.select()
    : Query.select(columns);

  sql = sql.from('problems')
    .where({ 'id': pid })
    .limit(1)
    .toString();

  DB.execute(sql, fn);
};


module.exports = Submission;
