/**
 * (C) Ahmed Dinar, 2017
 * Created at 11 sep, 2017
 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');
var exec = require('child_process').exec;

describe("COMPARATOR", function () {

  var samples = path.resolve(__dirname, 'samples');
  var judgeOutput = path.join(samples, 'judge.txt');
  var files = fs.readdirSync(samples);

  _.forEach(files, function(file){
    if(file === 'judge.txt') return;

    var sampleName = file.split('.')[0];
    describe(sampleName, function () {

      var command = './executor/comparator ' + judgeOutput  + ' ' + path.join(samples, file);
      var should = sampleName === 'identical' ? 'should be OK' : 'should throw not ok error';

      it(should, function (done){
        exec(command, {
          env: process.env,
          timeout: 9000,
          maxBuffer: 1000*1024
        },
        function(err, stdout, stderr) {
          expect(err).to.be.null;
          expect(stdout).to.not.be.undefined;
          expect(stdout).to.not.be.null;

          if(sampleName === 'identical'){
            expect(stderr).to.be.empty;
          }
          else{
            expect(stderr).to.not.be.undefined;
            expect(stderr).to.not.be.null;
          }

          done();
        });
      });
    });
  });

});