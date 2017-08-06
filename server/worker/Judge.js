'use strict';

var logger = require('winston');
var kue = require('kue');

var shuttingDowning = false;
//4 minutes
var TTL = 60000 * 4;
var queue = kue.createQueue();


queue.on('error', function(err) {
  if(!shuttingDowning){
    logger.error('There was an error in the judge push queue', err);
    shutdown();
  }
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


//
// shutdown queue
// Note: This will shutdown the whole node app, improve for better solution
// only shutdown the queue and submisson?
//
function shutdown(){
  if(!shuttingDowning){
    shuttingDowning = true;
    queue.shutdown(5000, function(err2){
      logger.info( 'Kue shutdown result: ', err2 || 'OK');
      process.exit( 0 );
    });
  }
}


module.exports = {
  push: queueSubmission
};