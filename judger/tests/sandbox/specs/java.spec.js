/**
 * (C) Ahmed Dinar, 2017
 * Created 6 sep, 2017
 */

var expect = require('chai').expect;
var async = require('async');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var chalk = require('chalk');
var _ = require('lodash');
var exec = require('child_process').exec;


var testCase = path.resolve(__dirname, '../samples/io/normal');
var sandboxPath = './executor/safejava ';
var judgeFiles = ['output.txt','error.txt','result.txt'];
var CHROOT_DIR = '/var/SECURITY/JAIL2/';
var RUN_DIR = '/home/runs/';
var TIME_LIMIT = 2500;
var MEMORY_LIMIT = 512;



describe("JAVA 8", function () {


  describe("GENERAL", function () {
    var source = path.resolve(__dirname, '../samples/java/general');


    describe("Compilation Error", function () {
      this.timeout(9000);

      var testName = 'CompilationError';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw Compilation Error", function (done){
        compileCode(file, pth, source, function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err).to.have.string('not a statement');
          done();
        });
      });
    });


    describe("Compilation Error Not Static Method", function () {
      this.timeout(9000);

      var testName = 'NonStaticMethod';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw Compilation Error when define a non static method", function (done){
        compileCode(file, pth, source, function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err).to.have.string('non-static method sayHello() cannot be referenced from a static context');
          done();
        });
      });
    });


    describe("Class Not Found", function () {
      this.timeout(9000);

      var testName = 'ClassNotFound';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

      after(function(done){
        rimraf(pth, done);
      });

      it("should throw should be declared class name", function (done){
        compileCode(file, pth, source, function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err).to.have.string('should be declared in a file named UnknownClass.java');
          done();
        });
      });
    });


    describe("No Main Method", function () {
      this.timeout(9000);

      var testName = 'NoMain';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw Main method not found error", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('Main method not found in class NoMain');
          done();
        });
      });
    });


    describe("Main Not Static", function () {
      this.timeout(9000);

      var testName = 'MainNotStatic';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw Main method not found error", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('Main method is not static in class MainNotStatic');
          done();
        });
      });
    });


    describe("Floating Point", function () {
      this.timeout(9000);

      var testName = 'FloatingPoint';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw java.lang.ArithmeticException", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.lang.ArithmeticException');
          done();
        });
      });
    });

    describe("Out Of Index", function () {
      this.timeout(9000);

      var testName = 'OutOfIndex';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw java.lang.ArrayIndexOutOfBoundsException", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.lang.ArrayIndexOutOfBoundsException');
          done();
        });
      });
    });

    describe("Out Of Memory", function () {
      this.timeout(9000);

      var testName = 'OutOfMemory';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw java.lang.OutOfMemoryError", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.lang.OutOfMemoryError');
          done();
        });
      });
    });

    describe("MemoryLimit", function () {
      this.timeout(9000);

      var testName = 'MemoryLimit';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

      before(function(done){
        MEMORY_LIMIT = 40;
        compileCode(file, pth, source, function(err){
          if(err){
            return done(err);
          }
          done();
        });
      });

      after(function(done){
        MEMORY_LIMIT = 512;
        rimraf(pth, done);
      });

      it("should throw Memory Limit Exceeded (rused)", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
         expect(stdout).to.be.empty;
         expect(stderr).to.be.empty;
         fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(3);
            expect(statusObj.msg).to.have.string('Memory Limit Exceeded');
            done();
          });
        });
      });
    });


    describe("Time Limit Exceeded", function () {
      this.timeout(9000);

      var testName = 'TimeLimit';
      var file = testName + '.java';
      var pth = CHROOT_DIR + 'home/runs/' + testName;

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

      it("should throw TLE", function (done){
        executeCode(pth, testName, function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.be.empty;
          fs.readFile(path.join(pth, 'result.txt'), 'utf8', function (error, data) {
            expect(error).to.be.null;
            expect(data).to.not.be.empty;
            var statusObj = _.zipObject(['code', 'msg','cpu','memory','error'], _.split(data,'$',5));
            expect(parseInt(statusObj.code)).to.equal(2);
            expect(statusObj.msg).to.have.string('TLE');
            done();
          });
        });
      });
    });

  });



  describe("FORBIDDEN", function () {
    var source = path.resolve(__dirname, '../samples/java/forbidden');


    describe("Readfile", function () {
      this.timeout(9000);

      var file = 'Readfile.java';
      var pth = CHROOT_DIR + 'home/runs/Readfile';

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


      it("should throw java.security.AccessControlException error", function (done){
        executeCode(pth, 'Readfile', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('java.io.FilePermission');
          done();
        });
      });
    });


    describe("Fork", function () {
      this.timeout(9000);

      var file = 'Fork.java';
      var pth = CHROOT_DIR + 'home/runs/Fork';

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

      it("should throw java.security.AccessControlException execute error", function (done){
        executeCode(pth, 'Fork', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('execute');
          done();
        });
      });
    });


    describe("ListDir", function () {
      this.timeout(9000);

      var file = 'ListDir.java';
      var pth = CHROOT_DIR + 'home/runs/ListDir';

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


      it("should throw java.security.AccessControlException read/ error", function (done){
        executeCode(pth, 'ListDir', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('read');
          done();
        });
      });
    });


    describe("Writefile", function () {
      this.timeout(9000);

      var file = 'Writefile.java';
      var pth = CHROOT_DIR + 'home/runs/Writefile';

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


      it("should throw java.security.AccessControlException error", function (done){
        executeCode(pth, 'Writefile', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('write');
          done();
        });
      });
    });


    describe("Mkdir", function () {
      this.timeout(9000);

      var file = 'Mkdir.java';
      var pth = CHROOT_DIR + 'home/runs/Mkdir';

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


      it("should throw java.security.AccessControlException error", function (done){
        executeCode(pth, 'Mkdir', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('write');
          done();
        });
      });
    });


    describe("Socket", function () {
      this.timeout(9000);

      var file = 'Socket.java';
      var pth = CHROOT_DIR + 'home/runs/Socket';

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


      it("should throw java.security.AccessControlException with java.net.SocketPermission error", function (done){
        executeCode(pth, 'Socket', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('java.net.SocketPermission');
          done();
        });
      });
    });


    describe("SystemProperty", function () {
      this.timeout(9000);

      var file = 'SystemProperty.java';
      var pth = CHROOT_DIR + 'home/runs/SystemProperty';

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


      it("should throw java.security.AccessControlException with java.util.PropertyPermission error", function (done){
        executeCode(pth, 'SystemProperty', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('java.util.PropertyPermission');
          done();
        });
      });
    });


    describe("LoadLibrary", function () {
      this.timeout(9000);

      var file = 'LoadLibrary.java';
      var pth = CHROOT_DIR + 'home/runs/LoadLibrary';

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


      it("should throw java.security.AccessControlException with java.lang.RuntimePermission with error", function (done){
        executeCode(pth, 'LoadLibrary', function(err, stdout, stderr){
          expect(err).to.be.null;
          expect(stdout).to.be.empty;
          expect(stderr).to.not.be.empty;
          expect(stderr).to.have.string('java.security.AccessControlException');
          expect(stderr).to.have.string('java.lang.RuntimePermission');
          done();
        });
      });
    });
  });


});




function executeCode(pth, sampleName, cb){
  var command = sandboxPath;
  command += sampleName + ' ';
  command += '-i ' + testCase + '/i.txt ';
  command += '-o ' + '/home/runs/' + sampleName + '/output.txt ';
  command += '-e ' + '/home/runs/' + sampleName + '/error.txt ';
  command += '-r ' + pth + '/result.txt ';
  command += '-t ' + String(TIME_LIMIT) + ' ';
  command += '-m ' + String(MEMORY_LIMIT) + ' ';
  command += '-c ' + CHROOT_DIR + ' ';
  command += '-d /home/runs/' + sampleName + ' ';

 // console.log( chalk.red('[CODE-RUN]: ') + chalk.cyan(command) );

  exec(command,{ env: process.env }, cb);
}




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
        case 'java':
          command = 'javac -d '+ pth + ' ' + file;
          break;
        default:
          return callback(new Error('Unknown Language'));
      }

    //  console.log(chalk.red('[CODE-COMPILE]: ') + chalk.yellow(command));

      exec(command, {
        env: process.env,
        timeout: 5000,
        maxBuffer: 1000*1024,
        cwd: source
      },
      function (err, stdout, stderr) {
        if(stderr) {
         // console.log(stderr);
          return callback(stderr);
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