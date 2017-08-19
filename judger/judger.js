'use strict';

var kue = require('kue');
var logger = require('winston');
var nconf = require('nconf');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

nconf.argv().env('_');

var ENV = nconf.get('NODE:ENV') || 'development';
var configPath = path.join(__dirname, 'config/env/' + ENV + '.json');

//check if config file exists.Otherwise exit node process.
//NOTE: really exit? or use default config somehow??
if( !fs.existsSync(configPath) ){
  console.log( chalk.bold.red('"' + configPath + '" config file not found.Please check.') );
  process.exit(1);
}else {
  nconf.file({ file: configPath });
}

require('./config/judge-logger');

var Judge = require('./judge');
var ContestJudge = require('./contestJudge');
var shuttingDowning = false;
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
    if( type !== 'submission' || type !== 'contest' ){
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
    if(!shuttingDowning){
      logger.error('error in submission judge queue', err);
      shutdown();
    }
  });



// queue.process('submission', Judge);
queue.process('submission', Judge);

//contest submission
queue.process('contest', ContestJudge);


//
// neccessary? or how to improved?
//
process.once( 'SIGTERM', function ( sig ) {
  logger.info('SIGTERM');
  shutdown();
});


//
// from on error event
//
process.once( 'uncaughtException', shutdown);



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
    logger.debug('removed completed submission %s from queue.\n', job.data.id);
  });
}


//
// shutdown queue
//
function shutdown(err){
  if(!shuttingDowning){
    shuttingDowning = true;
    queue.shutdown(5000, function(err2){
      logger.info( 'Kue shutdown result: ', err2 || 'OK');
      process.exit( 0 );
    });
  }
}