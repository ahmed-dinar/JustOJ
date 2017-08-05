'use strict';

var Query = appRequire('config/database/knex/query');
var DB = appRequire('config/database/knex/DB');

function Problem(id){
  this.id = id;
}


Problem.prototype.find = function(pid, columns, callback){
  var sql = (!columns || columns === undefined)
    ? Query.select()
    : Query.select(columns);

  sql = sql.from('problems')
    .where({ 'id': pid })
    .limit(1)
    .toString();

  DB.execute(sql, callback);
};