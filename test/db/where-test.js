var expect = require('chai').expect;
var where  = require('../../config/database/where');

describe("DATABASE", function () {
    describe("QUERY BUILDER", function () {
        describe("WHERE", function () {
            describe(".where()", function () {
                it("should match when passing integer", function (){
                    var s = where.where({
                        sid: 3
                    });
                    expect(s).equal("`sid`=3");
                });
            });
        });
    });
});
