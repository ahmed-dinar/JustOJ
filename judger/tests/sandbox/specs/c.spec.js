/**
 * (C) Ahmed Dinar, 2017
 * Created 6 sep, 2017
 */

var expect = require('chai').expect;
var async = require('async');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var chalk = require('chalk');
var _ = require('lodash');
var exec = require('child_process').exec;


var testCase = path.resolve(__dirname, '../samples/io/normal');
var sandboxPath = './executor/safec ';
var judgeFiles = ['output.txt','error.txt','result.txt'];
var TIME_LIMIT = 2500;
var MEMORY_LIMIT = 255;
var CHROOT_DIR = '/var/SECURITY/JAIL/';
var RUN_DIR = '/home/runs/';
var cppver = '';


describe("C++11", function () {
  var source = path.resolve(__dirname, '../samples/c/general');

  describe("Compilation Error without -std=c++11", function () {
    this.timeout(5000);

    var file = 'cpp11.cpp';
    var pth = CHROOT_DIR + 'home/runs/cpp11';

    after(function(done){
      rimraf(pth, done);
    });

    it("should have compilation error without -std=c++11", function (done){
      compileCode(file, pth, source, function(err){
        expect(err).to.not.be.undefined;
        expect(err).to.not.be.null;
        expect(err.message).to.have.string('Compilation Error');
        done();
      });
    });
  });

  describe("Compiled with -std=c++11", function () {
    this.timeout(5000);

    var file = 'cpp11.cpp';
    var pth = CHROOT_DIR + 'home/runs/cpp11';

    before(function(done){
      cppver = '-std=c++11';
      done();
    });

    after(function(done){
      cppver = '';
      rimraf(pth, done);
    });

    it("should compiled with -std=c++11", function (done){
      compileCode(file, pth, source, function(err){
        expect(err).to.be.undefined;
        done();
      });
    });
  });

});

describe("C++14", function () {
  var source = path.resolve(__dirname, '../samples/c/general');

  describe("Compilation Error without -std=c++14", function () {
    this.timeout(5000);

    var file = 'cpp14.cpp';
    var pth = CHROOT_DIR + 'home/runs/cpp14';

    after(function(done){
      rimraf(pth, done);
    });

    it("should have compilation error without -std=c++14", function (done){
      compileCode(file, pth, source, function(err){
        expect(err).to.not.be.undefined;
        expect(err).to.not.be.null;
        expect(err.message).to.have.string('Compilation Error');
        done();
      });
    });
  });

  describe("Compiled with -std=c++14", function () {
    this.timeout(5000);

    var file = 'cpp14.cpp';
    var pth = CHROOT_DIR + 'home/runs/cpp14';

    before(function(done){
      cppver = '-std=c++14';
      done();
    });

    after(function(done){
      cppver = '';
      rimraf(pth, done);
    });

    it("should compiled with -std=c++14", function (done){
      compileCode(file, pth, source, function(err){
        expect(err).to.be.undefined;
        done();
      });
    });
  });

});


describe("C/C++", function () {

  describe("GENERAL", function () {
    var source = path.resolve(__dirname, '../samples/c/general');

    describe("Compilation Error", function () {
      this.timeout(5000);

      var file = 'compilation_error.cpp';
      var pth = CHROOT_DIR + 'home/runs/compilation_error';

      after(function(done){
        rimraf(pth, done);
      });

      it("should have compilation error", function (done){
        compileCode(file, pth, source, function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err.message).to.have.string('Compilation Error');
          done();
        });
      });
    });


    describe("Floating Point Exception (SIGFPE)", function () {
      this.timeout(9000);

      var file = 'floating_point.c';
      var pth = CHROOT_DIR + 'home/runs/floating_point';

      before(function(done){
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw Floating Point Exception (SIGFPE) error", function (done){
        executeCode(pth, 'floating_point', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.be.empty;
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(1);
            expect(statusObj.msg).to.have.string('Floating Point (SIGFPE)');
            done();
          });
        });
      });
    });


    describe("Segmentation Fault (SIGSEGV)", function () {
      this.timeout(9000);

      var file = 'segment_fault.c';
      var pth = CHROOT_DIR + 'home/runs/segment_fault';

      before(function(done){
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw Segmentation Fault (SIGSEGV) error", function (done){
        executeCode(pth, 'segment_fault', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.be.empty;
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(1);
            expect(statusObj.msg).to.have.string('Segmentation Fault (SIGSEGV)');
            done();
          });
        });
      });
    });


    describe("Memory Limit Exceeded", function () {
      this.timeout(9000);

      var file = 'memory_limit.c';
      var pth = CHROOT_DIR + 'home/runs/memory_limit';

      before(function(done){
        MEMORY_LIMIT = 10;
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        MEMORY_LIMIT = 255;
        rimraf(pth, done);
      });

      it("should throw Memory Limit Exceeded error", function (done){
        executeCode(pth, 'memory_limit', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.be.empty;
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(3);
            expect(statusObj.msg).to.have.string('Memory Limit Exceeded (rused)');
            done();
          });
        });
      });
    });


    describe("SIGABRT", function () {
      this.timeout(9000);

      var file = 'SIGABRT.cpp';
      var pth = CHROOT_DIR + 'home/runs/SIGABRT';

      before(function(done){
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw SIGABRT (also std::bad_alloc) error", function (done){
        executeCode(pth, 'SIGABRT', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('std::bad_alloc');
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(1);
            expect(statusObj.msg).to.have.string('RE (SIGABRT)');
            done();
          });
        });
      });
    });


    describe("Time Limit Exceeded", function () {
      this.timeout(9000);

      var file = 'time_limit.c';
      var pth = CHROOT_DIR + 'home/runs/time_limit';

      before(function(done){
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw time limit exceeded error infinite loop", function (done){
        executeCode(pth, 'time_limit', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.be.empty;
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(2);
            expect(statusObj.msg).to.have.string('TLE (Rused) [timenow > cpuLimit]');
            done();
          });
        });
      });
    });


    describe("Time Limit Exceeded by Alarm", function () {
      this.timeout(9000);

      var file = 'tle_alarm.c';
      var pth = CHROOT_DIR + 'home/runs/tle_alarm';

      before(function(done){
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw time limit exceeded error by alarm", function (done){
        executeCode(pth, 'tle_alarm', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stderr).to.be.empty;
          expect(stdout).to.be.empty;

          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(2);
            expect(statusObj.msg).to.have.string('TLE (Alarm)');
            done();
          });
        });
      });
    });


  });




  describe("FORBIDDEN SYSTEM CALLS", function () {

    this.timeout(5000);

    var source = path.resolve(__dirname, '../samples/c/forbidden');
    var files = fs.readdirSync(source);

    _.forEach(files, function(file){

      var sampleName = file.split('.')[0];
      var pth = path.join('/var/SECURITY/JAIL/home/runs', sampleName);

      describe(sampleName, function () {

        this.timeout(5000);

        before(function(done) {
          compileCode(file, pth, source, function(err){
            if(err){
              return done(err);
            }
            done();
          });
        });

        after(function(done){
          //done();
          rimraf(pth, done);
        });

        it("should have run time error with 'Forbidden System Call' error", function (done){
          executeCode(pth, sampleName, function(err, stdout, stderr){
            expect(err).to.be.null;
            expect(stderr).to.be.empty;
            expect(stdout).to.be.empty;

            fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
              expect(error).to.be.null;
              expect(data).to.not.be.empty;
              var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
              expect(parseInt(statusObj.code)).to.equal(1);
              expect(statusObj.msg).to.have.string('RE (Forbidden System Call');
              expect(statusObj.error).to.have.string('RE (Forbidden System Call');
              expect(statusObj.error).to.have.string(getSystemCallName(sampleName));
              done();
            });
          });
        });

      });

    });
  });
});






//system call alias
function getSystemCallName(sampleName){
  switch(sampleName){
    case 'nice':
      return 'getpriority';
    case 'signal':
      return 'nanosleep';
    case 'fork':
      return 'clone';
    case 'getpwnam':
    case 'getgrnam':
      return 'socket';
    default:
      return sampleName;
  }
}


function executeCode(pth, sampleName, cb){
  var command = sandboxPath;
  command += sampleName + '/code ';
  command += '-i ' + testCase + '/i.txt ';
  command += '-o ' + '/home/runs/' + sampleName + '/output.txt ';
  command += '-e ' + '/home/runs/' + sampleName + '/error.txt ';
  command += '-r ' + pth + '/result.txt ';
  command += '-t ' + String(TIME_LIMIT) + ' ';
  command += '-m ' + String(MEMORY_LIMIT) + ' ';
  command += '-c ' + CHROOT_DIR + ' ';

 // console.log( chalk.red('[CODE-RUN]: ') + chalk.cyan(command) );

  exec(command,{ env: process.env }, cb);
}



//cppver = -std=c++11 / -std=c++14
function compileCode(file, pth, source, fn){

  var language = file.split('.').pop();

  async.waterfall([
    function(callback){
      mkdirp(pth, function (err) {
        if (err){
          callback(err)
        }
        return callback();
      });
    },
    function(callback){
      async.each(judgeFiles, function(file, cb) {
        fs.open(path.join(pth, file), 'w', function(err, fd){
          if( err ){
            return cb(err);
          }
          return cb();
        });
      }, callback);
    },
    function(callback){

      var command = null;
      switch(language.toLowerCase()) {
        case 'c':
          command = 'gcc -Wall -Wno-unused-result -O2 -fomit-frame-pointer -lm -o ' + pth +'/code ' + file;
          break;
        case 'cpp':
          command = 'g++ -w -O2 ' + cppver + ' -fomit-frame-pointer -lm -o ' + pth + '/code ' + file;
          break;
        default:
          return callback(new Error('Unknown Language'));
      }

      //console.log(chalk.red('[CODE-COMPILE]: ') + chalk.yellow(command));

      exec(command, {
        env: process.env,
        timeout: 5000,
        maxBuffer: 1000*1024,
        cwd: source
      },
      function (err, stdout, stderr) {
        if(stderr) {
         // console.log(stderr);
          return callback(new Error('Compilation Error stderr'));
        }

        if(err){
          console.log(err);
          return callback(err);
        }


       // console.log(chalk.green('Source Successfully Compiled'));

        return callback();
      });
    }
  ], fn);
}