'use strict';

var logger = require('winston');
var kue = require('kue');

var TTL = 60000 * 4; //4 minutes
var queue = kue.createQueue();

queue.on('error', function(err) {
  logger.error('There was an error in the judge push queue', err);
});


function queueSubmission(data, cb){
  queue
    .create('submission', data)
    .ttl(TTL)
    .events(false)
    .priority('high')
    .removeOnComplete(false)
    .save(cb);
}


module.exports = {
  push: queueSubmission
};