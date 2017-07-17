var expect = require('chai').expect;
var chai = require('chai');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);

const baseURL = 'http://localhost:3000';

describe('API', function () {
  describe('/signin', function () {

    this.timeout(5000);

    it('should return 401 when no credentials provided',function(){
      return chai
        .request(baseURL)
        .post('/api/signin')
        .catch(function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err.status).to.equal(401);
        });
    });

    it('should return 401 when username invalid',function(){
      return chai
        .request(baseURL)
        .post('/api/signin')
        .send({
          username: 'user_1'
        })
        .catch(function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err.status).to.equal(401);
        });
    });

    it('should return 401 when password invalid',function(){
      return chai
        .request(baseURL)
        .post('/api/signin')
        .send({
          password: 'some'
        })
        .catch(function(err){
          expect(err).to.not.be.undefined;
          expect(err).to.not.be.null;
          expect(err.status).to.equal(401);
        });
    });

    it('should return jwt when credentials are valid',function(){
      return chai
        .request(baseURL)
        .post('/api/signin')
        .send({
          username: 'user_1',
          password: '112358'
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.ownPropertyDescriptor('access_token');
        });
    });


  });
});
