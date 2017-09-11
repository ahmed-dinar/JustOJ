/**
 * (C) Ahmed Dinar, 2017
 * Created at 12 sep, 2017
 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');
var ClassChecker = require('../../lib/java-class-checker');

describe("JAVA Class Checker", function () {

  var samples = path.resolve(__dirname, 'samples');
  var files = fs.readdirSync(samples);

  _.forEach(files, function(file){
    var sampleName = file.split('.')[0];

    describe(sampleName, function(){

      var should = sampleName === 'ok' || sampleName === 'nested_class'
        ? 'class name should found'
        : 'class name should be null';

      it(should, function(done){
        fs.readFile(path.join(samples, file), 'utf8', function (err, code) {
          expect(err).to.be.null;
          var checks = ClassChecker(code);

          if(sampleName === 'ok' || sampleName === 'nested_class'){
            expect(checks).to.not.be.null;
            expect(checks.length).to.be.above(1);
            expect(checks[1]).to.be.equal('Some');
          }
          else{
            expect(checks).to.be.null;
          }

          done();
        });
      });
    });

  });

});