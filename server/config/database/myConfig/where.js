"use strict"

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
 * Helps us to build where statements query
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
 *                  age:25
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
    var counter = 0;

    _.forOwn(where, function(value, key) {

        if(isOperator(key)){
            ret += processOperator(key,value);
        }else{
            if( counter ){
                ret += ' AND ';
            }
            ret += mysql.escapeId(key) + '=' + mysql.escape(value);
            counter++;
        }

    });

    return ret;
};


/**
 *
 * @param opt
 * @param attributes
 * @returns {string}
 */
function processOperator(opt,attributes){

    var ret = '';

    switch(opt) {
        case '$or':
            ret += '(' + processAO('OR',attributes) + ')';
            break;

        case '$and':
            ret += '(' + processAO('AND',attributes) + ')';
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
            ret += '(' + processBet('BETWEEN',attributes) + ')';
            break;

        case '$notBetween':
            ret += '(' + processBet('NOT BETWEEN',attributes) + ')';
            break;

        case '$like':
            ret += '(' + processLike('LIKE ',attributes) + ')';
            break;

        case '$notLike':
            ret += '(' + processLike('NOT LIKE ',attributes) + ')';
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
 * $gt:{
 *    age: 30
 * }
 * // `age`>30
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
 *  $between:{
 *     age:[25,30]
 *  }
 *  //`age` BETWEEN 25 AND 30
 *
 *  $notBetween:{
 *     age:[25,30]
 *  }
 *  //`age` NOT BETWEEN 25 AND 30
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
 *  $like:{
 *    firstName: '%dinar'
 *  }
 *
 *  $notLike:{
 *    firstName: '%dinar'
 *  }
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