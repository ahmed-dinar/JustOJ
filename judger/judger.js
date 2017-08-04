'use strict';

var kue = require('kue');
var queue = kue.createQueue();

require('./judge-logger');
var logger = require('winston');

queue
  .on('job enqueue', function(id, type){
    logger.debug('Job %s got queued of type %s', id, type);
    kue.Job.get(id, function(err, job){
      if(err){
        logger.error(err);
        throw err;
      }
      logger.debug('and submission id ' + job.data.id);
    });
  })
  .on('job progress', function(id, progress){
    kue.Job.get(id, function(err, job){
      if (err){
        logger.error(err);
        throw err;
      }
      logger.debug('\n  job #' + id + ' ' + progress + '% complete with submission id ', job.data.id );
    });
  })
  .on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
      if (err) throw err;
      job.remove(function(err){
        if (err){
          logger.error(err);
          throw err;
        }
        logger.debug('Removed completed submission with id ' + job.data.id);
      });
    });
  })
  .on('error', function(err) {
    logger.error('error in judge queue', err);
  });


queue
  .process('submit', function(job, done){

    var data = job.data;

    setTimeout(function(){
      done(null, 'Done judge of submission id ' + data.id);
    }, 2000);
  });


