'use strict';

var assign = require('lodash/assign');
var exec = require('child_process').exec;
var logger = require('winston');
var chalk = require('chalk');
var JudgeError = require('./config/judge-error.js');

//command = 'gcc -w -O2 -fomit-frame-pointer -lm -o ' + judge.runDir +'/code code.c';



//
// `sandbox` = the path of sandbox executable to run the code which written in C
//
function Compiler(options){
  this.id = options.id;
  this.language = options.language;
  this.path = options.path;
  this.source = options.source;
  this.cpu = options.cpu;
  this.memory = options.memory;
  this.sandbox = './sandbox/contest/safejudge ';
}



Compiler.prototype.compile = function(fn){

  var command = null;
  var _this = this;

  switch(_this.language) {
    case 'c':
      command = 'gcc -Wall -Wno-unused-result -O2 -fomit-frame-pointer -lm -o ' + _this.path +'/code contest_' + _this.id + '.' + _this.language;
      break;
    case 'cpp':
      command = 'g++ -w -O2 -fomit-frame-pointer -lm -o ' + _this.path + '/code contest_' + _this.id + '.' + _this.language;
      break;
    default:
      return fn(new JudgeError('Unknown Language ' + _this.language, 'INVALID_LANGUAGE'));
  }

  logger.debug(chalk.red('[CODE-COMPILE]: ') + chalk.cyan(_this.source), chalk.yellow(command));

  var options = {
    env: process.env,
    timeout: 0,
    maxBuffer: 1000*1024,
    cwd: _this.source
  };

  return exec(command, options, fn);
};



//
//  `_this.id` = the submission id as well as the run directory name
// (_this.id + '/code ') = it will normalize with prefix path inside chroot jail
// `this.path` = absolute chroot jail run directory inside main OS i,e /var/SECURITY/JAIL/home/runs/{id}
// `/home/runs/{id}` = run directory inside chroot jail
// `testCase` = testCase directory
//
Compiler.prototype.execute = function run(testCase, fn){

  var _this = this;

  var command = _this.sandbox;
  command += 'contest_' + _this.id + '/code ';
  command += '-i ' + testCase + '/i.txt ';
  command += '-o ' + '/home/runs/contest_' + _this.id + '/output.txt ';
  command += '-e ' + '/home/runs/contest_' + _this.id + '/error.txt ';
  command += '-r ' + _this.path + '/result.txt ';
  command += '-t ' + String(_this.cpu) + ' ';
  command += '-m ' + String(_this.memory);

  logger.debug( chalk.red('[CODE-RUN]: ') + chalk.cyan(command) );

  exec(command,{ env: process.env }, fn);
};




module.exports = Compiler;