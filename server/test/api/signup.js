

var expect = require('chai').expect;
var chai = require('chai');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);

const baseURL = 'http://localhost:3000';

describe('API', function () {
  describe('/signup', function () {

    this.timeout(5000);

    it('should return 400 when no credentials provided',function(){
      return chai
        .request(baseURL)
        .send({
          username: 'ahmeddinar',
          password: '112358',
          email: 'madinar.cse@gmail.com'
        })
        .post('/api/signup')
        .catch(function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err.status).to.equal(400);
        });
    });


  });
});
