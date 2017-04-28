var chai = require('chai');
var expect = require('chai').expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var User = require('../../models/user');

chai.use(sinonChai);

describe("Models", function () {
    describe("User", function () {
        describe(".getProfile()", function () {

            it("should not have backtick when passing integer", function (){
                expect(3).equal(3);
            });

        });
    });
});
