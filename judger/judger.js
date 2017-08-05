'use strict';

var kue = require('kue');
var logger = require('winston');
var nconf = require('nconf');
var Judge = require('./judge');

nconf.argv().env('_');
require('./config/judge-logger');

var queue = kue.createQueue();

//2 seconds
queue.watchStuckJobs(2000);

queue.failedCount('submission', function( err, total ) {
  logger.debug('failed submissions = ' + total);
});

queue.inactiveCount('submission',function( err, total ) {
  logger.debug('inactive submissions = ' + total);
});

queue.activeCount('submission',function( err, total ) {
  logger.debug('stuck active submissions = ' + total);
});


queue
  .on('job enqueue', function(id, type){
    //something went wrong?
    if( type !== 'submission' ){
      logger.error('Unknown job %s of type %s', id, type);
      return;
    }

    kue.Job.get(id, function (err, job){
      if(err){
        logger.info('Submission #%s got queued', id);
        logger.error(err);
        throw err;
      }
      logger.info('Submission #%s got queued with id %s', id, job.data.id);
    });
  })
  .on('job complete', function(id, result){
    kue.Job.get(id, popSubmission);
  })
  .on('job failed', function(err){
    logger.error('judge job failed', err);
  })
  .on('error', function(err) {
    logger.error('error in submission judge queue', err);
  });



// queue.process('submission', Judge);
queue.process('submission', Judge);


//
// neccessary? or how to improved?
//
process.once( 'SIGTERM', function ( sig ) {
  queue.shutdown(5000, function(err) {
    logger.error('Kue shutdown: ', err);
    process.exit( 0 );
  });
});



//
// remove a submission from queue
//
function popSubmission(error, job){
  if (error){
    logger.error('submission on complete error', error);
    //throw err;
  }

  job.remove(function(err){
    if (err){
      logger.error('pop submission error', err);
      //throw err;
    }
    logger.debug('removed completed submission %s from queue.', job.data.id);
  });
}