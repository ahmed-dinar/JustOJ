'use strict';

var kue = require('kue');
var queue = kue.createQueue();
queue.watchStuckJobs(5000);

queue.on('error', function(err) {
  console.error('There was an error in the main queue!');
  console.log(err);
});

function createJob(data, cb){

  queue
    .create('submit', data)
    .priority('high')
    .removeOnComplete(false)
    .save(cb);
}


module.exports = {
  create: createJob
};