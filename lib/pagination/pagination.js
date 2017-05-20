'use strict';

/**
 *
 * @type {exports|module.exports}
 * @private
 */

var _ = require('lodash');


/**
 *
 * @type {Function}
 */
var Pagination = exports.Pagination = function Pagination(cur_page, page_limit, total, url) {

    var _this = this;
    _this.cur_page = parseInt(cur_page);
    _this.page_limit = parseInt(page_limit);
    _this.total = parseInt(total);
    _this.url = url;

    return _this;
};


/**
 *
 * @returns {number}
 */
Pagination.prototype.offset = function() {
    return (this.cur_page - 1) * this.page_limit;
};


/**
 *
 * @returns {*}
 */
Pagination.prototype.totalPages = function() {
    return _.ceil(this.total/this.page_limit);
};

/**
 *
 * @returns {number}
 */
Pagination.prototype.prevPage = function() {
    return (this.cur_page - 1);
};


/**
 *
 * @returns {*}
 */
Pagination.prototype.nextPage = function() {
    return (this.cur_page + 1);
};


/**
 *
 * @returns {boolean}
 */
Pagination.prototype.hasPrevPage = function() {
    return this.prevPage() > 0;
};


/**
 *
 * @returns {boolean}
 */
Pagination.prototype.hasNextPage = function() {
    return this.nextPage() <= this.totalPages();
};