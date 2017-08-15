'use strict';


var express = require('express');
var router = express.Router();

var _ = require('lodash');
var entities = require('entities');
var has = require('has');
var async = require('async');
var logger = require('winston');
var moment = require('moment');
var slug = require('slug');
var Hashids = require('hashids');
var config = require('nconf');
var json2csv = require('json2csv');

var User = require('./user');
var Problems = appRequire('models/problems');
var Contest = appRequire('models/contest');
var AppError = appRequire('lib/custom-error');
var Schema = appRequire('config/validator-schema');
var OK = appRequire('middlewares/OK');
var authJwt = appRequire('middlewares/authJwt');
var roles = appRequire('middlewares/roles');
var getPage = appRequire('middlewares/page');


var problemHash = new Hashids(config.get('HASHID:PROBLEM'), 11);
var contestHash = new Hashids(config.get('HASHID:CONTEST'), 11);

slug.defaults.mode ='pretty';



router.get('/list',function(req, res, next) {


  //past contests
  if( has(req.query,'past') ){

    Contest.past(function(err, data){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      logger.debug('past = ', data);

      res.status(200).json(data);
    });
    return;
  }


  async.parallel({
    running: Contest.running,
    future: Contest.future
  },
  function(err, data){
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }

    logger.debug('contests = ', data);

    res.status(200).json(data);
  });
});



//
// Create a contest
//
router.post('/create', authJwt, roles('admin'), function(req, res, next){

  var titleSlug = slug(req.body.title.replace(/[^a-zA-Z0-9 ]/g, ' '));

  async.waterfall([
    function(callback){
      return validateBody(req, callback);
    },
    function(data, callback){
      data.slug = entities.encodeHTML(titleSlug);
      return Contest.save(data, callback);
    }
  ],
  function(err, contestInfo){
    if(err){
      if(err.name === 'input'){
        return res.status(400).json({ error: err.message });
      }
      logger.error(err);
      return res.sendStatus(500);
    }

    logger.debug(contestInfo);

    return res
      .status(200)
      .json(contestHash.encode(contestInfo.insertId));
  });
});


router
  .route('/admin')
  .all(authJwt, roles('admin'), OK())
  .get(function(req, res){

    Contest.editable(function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      _.forEach(rows, function(c, i){
        rows[i].id = contestHash.encode(rows[i].id);
        rows[i].title = entities.decodeHTML(rows[i].title);
      });

      logger.debug(rows);

      res.status(200).json(rows);
    });
  })
  .delete(function(req, res){

    var cid = has(req.query,'contest')
      ? contestHash.decode(req.query.contest)
      : null;

    if(!cid || !cid.length){
      return res.sendStatus(400);
    }

    Contest.delete(cid[0], function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }
      logger.debug(rows);
      return res.sendStatus(200);
    });
  })
  .put(function(req, res){

    var cid = has(req.query,'contest')
     ? contestHash.decode(req.query.contest)
     : null;

    var visible = has(req.body, 'visible')
     ? parseInt(req.body.visible)
     : null;

    if(!cid || !cid.length || !visible || !_.inRange(visible, 1, 3) ){
      return res.sendStatus(400);
    }

    async.waterfall([
      function(callback){
        Contest.find(cid, ['status'], function(err, rows){
          if(err){
            return callback(err);
          }
          if( !rows.length ){
            return callback(new AppError('No Contest Found', '404'));
          }
          if( parseInt(rows[0].status) === 0 && visible === 2 ){
            return callback(new AppError('Incomplete contest cannot be public.', '400'));
          }
          return callback();
        });
      },
      function(callback){
        Contest.put(cid,{ status: visible }, callback);
      }
    ],
    function(err, rows){
      if(err){
        if( err.name === '400' || err.name === '404' ){
          return res.status(err.name).json({ error: err.message });
        }
        logger.error(err);
        return res.sendStatus(500);
      }
      logger.debug(rows);
      return res.sendStatus(200);
    });

  });


//
//
//
router
  .route('/edit/:cid')
  .all(authJwt, roles('admin'), OK())
  .get(function(req, res){
    var cid = contestHash.decode(req.params.cid);

    if(!cid || !cid.length){
      return res.sendStatus(404);
    }

    Contest.fetch(cid[0], ['*'], function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      if( !rows.length ){
        return res.sendStatus(404);
      }
      rows = rows[0];

      logger.debug(rows);

      var dif = moment.duration( moment(rows.end).diff(moment(rows.begin)) );
      var duration = moment({
        hours: dif.hours(),
        minutes: dif.minutes(),
        seconds: dif.seconds()
      }).format('HH:mm:ss');

      return res.status(200).json({
        type: rows.privacy,
        begin: moment(rows.begin).format('YYYY-MM-DD HH:mm:ss'),
        duration: duration,
        days: dif.days(),
        title: entities.decodeHTML(rows.title),
        description: entities.decodeHTML(rows.description)
      });
    });
  })
  .put(function(req, res, next){
    var cid = contestHash.decode(req.params.cid);
    var titleSlug = slug(req.body.title.replace(/[^a-zA-Z0-9 ]/g, ' '));

    async.waterfall([
      function(callback){
        return validateBody(req, callback);
      },
      function(data, callback){
        data.slug = entities.encodeHTML(titleSlug);
        return Contest.put(cid, data, callback);
      }
    ],
    function(err, rows){
      if(err){
        if(err.name === 'input'){
          return res.status(400).json({ error: err.message });
        }
        logger.error(err);
        return res.sendStatus(500);
      }

      res.sendStatus(200);
    });
  });



//
// download participants list
//
router.get('/edit/:cid/users/download', authJwt, roles('admin'), function(req, res){

  var cid = contestHash.decode(req.params.cid);
  if(!cid || !cid.length){
    return res.sendStatus(404);
  }

  async.waterfall([
    function(callback){
      Contest.find(cid[0], ['id'], function(err, rows){
        if(err){
          return callback(err);
        }
        if(!rows.length){
          return callback(new AppError('No Contest Found', '404'));
        }
        return callback();
      });
    },
    function (callback) {
      Contest.download(cid[0], callback);
    },
    function (participants,callback) {
      json2csv({ data: participants, fields: ['username','password'], fieldNames: ['USERNAME', 'PASSWORD'] }, callback);
    }
  ],
  function (err, csvData) {
    if(err){
      if(err.name === '404'){
        return res.status(404).json({ error: err.message });
      }
      logger.error(err);
      return res.sendStatus(500);
    }

    res.attachment('participantsList.csv');
    res.status(200).send(csvData);
  });
});



//
// delet multuple users
//
router.post('/edit/:cid/users/delete', authJwt, roles('admin'), function(req, res){

  var cid = contestHash.decode(req.params.cid);
  if(!cid || !cid.length || !has(req.body,'users') ){
    return res.sendStatus(404);
  }

  logger.debug('uids  =  ', req.body.users);

  Contest.deleteUser(cid[0], req.body.users, function(err, rows){
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }
    logger.debug(rows);
    return res.sendStatus(200);
  });
});



//
// edit participants
//
router
  .route('/edit/:cid/users')
  .all(authJwt, roles('admin'), OK())
  .get(getPage, function(req, res){
    var cid = contestHash.decode(req.params.cid);

    if(!cid || !cid.length){
      logger.debug('what!');
      return res.sendStatus(404);
    }

    logger.debug('cur page = ', req.page);

    Contest.users(cid, req.page, function(err, rows, pagination){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      logger.debug('contestants = ', rows);
      logger.debug(typeof rows);
      logger.debug(pagination);

      res.status(200).json({
        users: rows,
        pagination: pagination
      });
    });
  })
  .post(function(req, res){

    var cid = contestHash.decode(req.params.cid);
    if(!cid || !cid.length){
      return res.sendStatus(404);
    }
    cid = cid[0];

    logger.debug(req.body);

    async.waterfall([
      function(callback){
        validateUserBody(req, callback);
      },
      function(callback){
        Contest.find(cid, ['id'], function(err, rows){
          if(err){
            return callback(err);
          }
          if(!rows.length){
            return callback(new AppError('No Contest Found', '404'));
          }
          return callback();
        });
      },
      function(callback){
        Contest.insertUser(cid, {
          username: req.body.username,
          name: req.body.name,
          institute: has(req.body, 'institute') ? req.body.institute : '',
          password: has(req.body, 'password') ? req.body.password : null,
          website : '',
          role: 'gen'
        }, callback);
      }
    ],
    function(err, rows){
      if(err){
        if(err.name === 'input'){
          return res.status(400).json({ error: err.message });
        }
        if(err.name === '404'){
          return res.status(404).json({ error: err.message });
        }
        logger.error(err);
        return res.sendStatus(500);
      }
      return res.sendStatus(200);
    });
  })
  .put(function(req, res){

    var cid = contestHash.decode(req.params.cid);
    if(!cid || !cid.length){
      return res.sendStatus(404);
    }
    cid = cid[0];

    if( !has(req.body,'uid') ){
      return res.sendStatus(400);
    }

    async.waterfall([
      function(callback){
        validateUserBody(req, callback);
      },
      function(callback){
        Contest.find(cid, ['id'], function(err, rows){
          if(err){
            return callback(err);
          }
          if(!rows.length){
            return callback(new AppError('No Contest Found', '404'));
          }
          return callback();
        });
      },
      function(callback){
        Contest.putUser(req.body.uid, {
          username: req.body.username,
          name: req.body.name,
          institute: req.body.institute,
          password: has(req.body, 'password') ? req.body.password : null
        }, callback);
      }
    ],
    function(err){
      if(err){
        if(err.name === 'input'){
          return res.status(400).json({ error: err.message });
        }
        if(err.name === '404'){
          return res.status(404).json({ error: err.message });
        }
        logger.error(err);
        return res.sendStatus(500);
      }
      return res.sendStatus(200);
    });
  })
  .delete(function(req, res){

    var cid = contestHash.decode(req.params.cid);
    if(!cid || !cid.length || !has(req.query,'user') ){
      return res.sendStatus(404);
    }

    var uid = req.query.user === 'all'
      ? req.query.user
      : [ req.query.user ];

    logger.debug('uid  =  ', uid);
    console.log(uid);

    Contest.deleteUser(cid[0], uid, function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }
      logger.debug(rows);
      return res.sendStatus(200);
    });
  });


//
//
//
router
  .route('/edit/:cid/problems')
  .all(authJwt, roles('admin'), OK())
  .get(function(req, res){
    var cid = contestHash.decode(req.params.cid);

    if(!cid || !cid.length){
      return res.sendStatus(404);
    }

    Contest.findProblems(cid, ['id','title','status'], function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      _.forEach(rows, function(element, index) {
        rows[index].id = problemHash.encode(rows[index].id);
      });

      logger.debug(rows);

      res.status(200).json(rows);
    });
  })
  .delete(function(req, res){

    var pid = has(req.query,'problem')
      ? problemHash.decode(req.query.problem)
      : null;

    if(!pid || !pid.length){
      return res.sendStatus(404);
    }

    Problems.delete(pid, function(err, rows){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }
      logger.debug(rows);
      return res.sendStatus(200);
    });
  });



//
// validate insert user data
//
function validateUserBody(req, fn){
  req.checkBody(Schema.randomuser);
  req.checkBody('username','already taken').userExists();

  logger.debug('validating inputs..');

  req
    .getValidationResult()
    .then(function(result) {
      if (!result.isEmpty()){
        var e = result.array()[0];
        logger.debug(e);
        return fn(new AppError(e.param + ' ' + e.msg,'input'));
      }

      return fn();
    });
};



//
// validate create contest data
//
function validateBody(req, fn){
  req.sanitize('title').escapeInput();
  req.sanitize('description').escapeInput();
  req.checkBody(Schema.contest);
  if( has(req.body,'days') && parseInt(req.body.days) === 0 ){
    req.checkBody('duration', 'cant be less 30 minutes').minDuration(30);
  }
  req
    .getValidationResult()
    .then(function(result) {

      if (!result.isEmpty()){
        var e = result.array()[0];
        logger.debug(result.array());
        return fn(new AppError(e.param + ' ' + e.msg,'input'));
      }

      var duration = moment.duration(req.body.days + '.' + req.body.duration);
      var data = {
        title: req.body.title,
        status: 0,
        privacy: req.body.type,
        description: req.body.description,
        begin: moment(req.body.when).format('YYYY-MM-DD HH:mm:ss'),
        end: moment(req.body.when).add(duration).format('YYYY-MM-DD HH:mm:ss')
      };

      return fn(null, data);
    });
}


module.exports = router;

