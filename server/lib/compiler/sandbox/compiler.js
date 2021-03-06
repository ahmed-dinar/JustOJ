'use strict';


var exec = require('child_process').exec;
var logger = require('winston');
var chalk = require('chalk');


/**
 *
 * @param codeDir    -> name of the program folder created by uuid. example: 89e99d8b-4552-41f1-8a12-76668334328d
 * @param inputPath  -> judge data inputfile path
 * @param fn
 */
exports.run = function run(opts,testCase,fn){

  var command = './lib/compiler/sandbox/safejudge ';
  command += opts.runName + '/code ';
  command += '-i ' + testCase + '/i.txt ';
  command += '-o ' + '/home/runs/' + opts.runName + '/output.txt ';
  command += '-e ' + '/home/runs/' + opts.runName + '/error.txt ';
  command += '-r ' + opts.runDir + '/result.txt ';
  command += '-t ' + String(opts.timeLimit) + ' ';
  command += '-m ' + String(opts.memoryLimit);

  logger.debug( chalk.red('[CODE-RUN]: ') + chalk.cyan(command) );

  exec(command,{ env: process.env }, fn);
};


/**
 *
 * @param codePath -> example: /SECURITY/JAIL/home/run/89e99d8b-4552-41f1-8a12-76668334328d
 * @param fn
 * @returns {*}
 */
exports.compile = function compile(opts,fn){

  var command = null;
  switch(opts.language) {
    case 'c':
            //command = 'gcc -w -O2 -fomit-frame-pointer -lm -o ' + opts.runDir +'/code code.c';
      command = 'gcc -Wall -O2 -fomit-frame-pointer -lm -o ' + opts.runDir +'/code code.c';
      break;
    case 'cpp':
      command = 'g++ -w -O2 -fomit-frame-pointer -lm -o ' + opts.runDir + '/code code.cpp';
      break;
    case 'java':
      return fn('Java will be supported soon!','');
      break;
    default:
      return fn('invalid language','');
  }

  logger.debug( chalk.red('[CODE-COMPILE]: ') + chalk.cyan(opts.codeDir), chalk.yellow(command) );

  var cnfg = {
    env: process.env,
    timeout: 0,
    maxBuffer: 1000*1024,
    cwd: opts.codeDir
  };

  exec(command, cnfg, function(err, stdout, stderr) {

    logger.debug(
            'we are in compiler',
            err,
            'stderr:',
            stderr,
            'we are out of compiler'
        );

    if (err)
      return fn(err,stderr);

    fn(null,null, stdout);
  });
};
