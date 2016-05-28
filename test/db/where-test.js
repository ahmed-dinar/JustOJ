var expect = require('chai').expect;
var where  = require('../../config/database/myConfig/where');

describe("DATABASE", function () {
    describe("Query Builder", function () {
        describe(".where()", function () {
            describe("Operators", function () {

                describe("=", function () {

                    it("should not have backtick when passing integer", function (){
                        var s = where.where({
                            sid: 3
                        });
                        expect(s).equal("`sid`=3");
                    });

                    it("should empty when passing empty object", function (){
                        var s = where.where({});
                        expect(s).equal("");
                    });

                    it("should empty when no object passed", function (){
                        var s = where.where();
                        expect(s).equal("");
                    });

                    it("should add AND operator when passing multiple equal", function (){
                        var s = where.where({
                            name: 'dinar',
                            dept: 'cse'
                        });
                        expect(s).equal("`name`='dinar' AND `dept`='cse'");
                    });

                });

                describe("AND, OR", function () {

                    it("should have bracket", function (){
                        var s = where.where({
                            $and:{
                                name: 'dinar',
                                dept: 'cse'
                            }
                        });
                        expect(s).equal("(`name`='dinar' AND `dept`='cse')");
                    });

                    it("should pass on nested statement", function (){
                        var s = where.where({
                            $and:{
                                name: 'dinar',
                                $or: {
                                    dept: 'cse',
                                    roll: '120135'
                                }
                            }
                        });
                        expect(s).equal("(`name`='dinar' AND (`dept`='cse' OR `roll`='120135'))");
                    });

                });

                describe(">, <, >=, <=, !=", function () {

                    it("should pass", function (){
                        var s = where.where({
                            $and:{
                                $gt:{
                                    age: 3
                                },
                                $lt:{
                                    age: 6
                                },
                                $ge:{
                                    height: 5
                                },
                                $le:{
                                    height: 9
                                },
                                $ne:{
                                    roll: 112200
                                }
                            }
                        });
                        expect(s).equal("(`age`>3 AND `age`<6 AND `height`>=5 AND `height`<=9 AND `roll`!=112200)");
                    });

                });

              /*  describe("BETWEEN , NOT BETWEEN", function () {

                    it("should pass", function (){
                        var s = where.where({
                            $and:{
                                $between:{
                                    age:[25,30]
                                },
                                $notBetween:{
                                    roll:[100,200]
                                }
                            }
                        });
                        expect(s).equal("((`age` BETWEEN 25 AND 30) AND (`roll` NOT BETWEEN 100 AND 200))");
                    });

                });*/

                describe("LIKE , NOT LIKE", function () {

                    it("should pass", function (){
                        var s = where.where({
                            $or:{
                                $like:{
                                    firstName: '%dinar'
                                },
                                $notLike:{
                                    lastName: 'Ok%'
                                }
                            }
                        });
                        expect(s).equal("((`firstName` LIKE '%dinar') OR (`lastName` NOT LIKE 'Ok%'))");
                    });

                });

            });
        });
    });
});
