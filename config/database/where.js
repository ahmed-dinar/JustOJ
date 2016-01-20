/**
 *
 * @author <a href="madinar.cse@gmail.com">Ahmed Dinar</a>
 *
 *
 * @type {exports|module.exports}
 * @private
 */

var _          = require('lodash');
var mysql      = require('mysql');

/**
 *
 * This helps us to build where statements query
 *
 * ``example
 * where:{
 *       $and:{
 *           identity:'employee',
 *           $and:{
 *               $gt:{
 *                  age:20
 *               },
 *               $lt:{
 *                  age:28
 *               }
 *           }
 *      }
 * }
 *
 * returns:  identity=`employee` AND (age>20 AND age<25)
 *
 * ```
 *
 * @param where
 * @returns {string}
 */
exports.where = function(where){

    var ret = '';

    _.forOwn(where, function(value, key) {

        if(isOperator(key)){
            ret += processOperator(key,value);
        }else{
            ret += mysql.escapeId(key) + '=' + mysql.escape(value);
        }

    });

    return ret;
};


/**
 *
 * @param operaotor
 * @param attributes
 * @returns {string}
 */
function processOperator(opt,attributes){



    var ret = '';

    switch(opt) {
        case '$or':
            ret += '(';
            ret += processAO('OR',attributes);
            ret += ')';
            break;

        case '$and':
            ret += '(';
            ret += processAO('AND',attributes);
            ret += ')';
            break;

        case '$gt':
            ret += processThan('>',attributes);
            break;

        case '$lt':
            ret += processThan('<',attributes);
            break;

        case '$ge':
            ret += processThan('>=',attributes);
            break;

        case '$le':
            ret += processThan('<=',attributes);
            break;

        case '$ne':
            ret += processThan('!=',attributes);
            break;

        case '$between':
            ret += processBet('BETWEEN',attributes);
            break;

        case '$notBetween':
            ret += processBet('NOT BETWEEN',attributes);
            break;

        case '$like':
            ret += processLike('LIKE ',attributes);
            break;

        case '$notLike':
            ret += processLike('NOT LIKE ',attributes);
            break;

        default:

    }

    return ret;
}


/**
 *
 * @param opt
 * @param attributes
 * @returns {string}
 */
function processAO(opt,attributes){
    var ret = '';
    var count = 0;

    _.forOwn(attributes, function(value, key) {

        if(count>0){
            ret += ' ' + opt + ' ';
        }

        if(isOperator(key)){
            ret += processOperator(key,value);
        }else{
            ret += mysql.escapeId(key) + '=' + mysql.escape(value);
        }

        count++;

    });

    return ret;
}


/**
 *
 * @param opt
 * @param attributes
 * @returns {string}
 */
function processThan(opt,attributes){
    var ret = '';
    _.forOwn(attributes, function(value, key) {
        ret += mysql.escapeId(key) + opt + mysql.escape(value);
    });
    return ret;
}


/**
 *
 * @param cond
 * @param attributes
 * @returns {string}
 */
function processBet(cond,attributes){
    var ret = '';
    _.forOwn(attributes, function(value, key) {
        ret +=  mysql.escapeId(key) + ' ' + cond + ' ' + _.pluck(attributes,0) + ' AND ' + _.pluck(attributes,1);
    });
    return ret;
}


/**
 *
 * @param cond
 * @param string
 * @returns {string}
 */
function processLike(cond,string){
    var ret = '';

    _.forOwn(string, function(value, key) {
        ret +=  mysql.escapeId(key) + ' ' + cond + "'" + value + "'";
    });

    return ret;
}


/**
 *
 * @param opt
 * @returns {boolean}
 */
function isOperator(opt){
    return (opt.charAt(0) === '$');
}