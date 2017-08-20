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
var typeis = require('type-is');

var ContestValidator = appRequire('lib/validators/contest');
var csvUser = require('./contest/csvUser');
var Submit = require('./contest/submit');
var Problems = appRequire('models/problems');
var Contest = appRequire('models/contest');
var AppError = appRequire('lib/custom-error');
var Schema = appRequire('config/validator-schema');
var OK = appRequire('middlewares/OK');
var authJwt = appRequire('middlewares/authJwt');
var roles = appRequire('middlewares/roles');
var getPage = appRequire('middlewares/page');
var getContestId = appRequire('middlewares/contestId');
var authUser = appRequire('middlewares/authUser');
var handleError = appRequire('lib/handle-error');

var problemHash = new Hashids(config.get('HASHID:PROBLEM'), 11);
var contestHash = new Hashids(config.get('HASHID:CONTEST'), 11);
var submissionHash = new Hashids(config.get('HASHID:CONTESTSUB'), 11);
var clarHash = new Hashids(config.get('HASHID:CLAR'), 11);
var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

slug.defaults.mode ='pretty';


router.get('/list',function(req, res, next) {


  //past contests
  if( has(req.query,'past') ){

    Contest.past(function(err, data){
      if(err){
        logger.error(err);
        return res.sendStatus(500);
      }

      _.forEach(data, function(c,i){
        data[i].id = contestHash.encode(data[i].id);
        data[i].title = entities.decodeHTML(data[i].title);
        data[i].slug = entities.decodeHTML(data[i].slug);
      });

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

    _.forEach(data.future, function(c,i){
      data.future[i].id = contestHash.encode(data.future[i].id);
      data.future[i].title = entities.decodeHTML(data.future[i].title);
      data.future[i].slug = entities.decodeHTML(data.future[i].slug);
    });

    _.forEach(data.running, function(c,i){
      data.running[i].id = contestHash.encode(data.running[i].id);
      data.running[i].title = entities.decodeHTML(data.running[i].title);
      data.running[i].slug = entities.decodeHTML(data.running[i].slug);
    });


    logger.debug('contests = ', data);

    res.status(200).json({
      running: data.running,
      future: data.future
    });
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



//
//
//
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

        new ContestValidator(cid[0])
          .isReady()
          .then(function(isReady){
            if( !isReady && visible === 2 ){
              return callback(new AppError('Incomplete contest cannot be public.', '400'));
            }
            return callback();
          })
          .catch(callback);
      },
      function(callback){
        Contest.put(cid[0],{ status: visible }, callback);
      }
    ],
    function(err, rows){
      if(err){
        if( err.name === '400' || err.name === 'NOT_FOUND' ){
          return res.status(err.name === '400' ? 400 : 404).json({ error: err.message });
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
  .all(getContestId, authJwt, roles('admin'), OK())
  .get(function(req, res){

    Contest.fetch(req.contestId, ['*'], function(err, rows){
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

    var titleSlug = slug(req.body.title.replace(/[^a-zA-Z0-9 ]/g, ' '));

    async.waterfall([
      function(callback){
        return validateBody(req, callback);
      },
      function(data, callback){
        data.slug = entities.encodeHTML(titleSlug);
        return Contest.put(req.contestId, data, callback);
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
router.get('/edit/:cid/users/download', getContestId, authJwt, roles('admin'), function(req, res){

  async.waterfall([
    function(callback){
      Contest.find(req.contestId, ['id'], function(err, rows){
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
      Contest.download(req.contestId, callback);
    },
    function (participants,callback) {
      json2csv({ data: participants, fields: ['username','password','institute'], fieldNames: ['USERNAME', 'PASSWORD','INSTITUTE'] }, callback);
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
router.post('/edit/:cid/users/delete', getContestId, authJwt, roles('admin'), function(req, res){

  logger.debug('uids  =  ', req.body.users);

  Contest.deleteUser(req.contestId, req.body.users, function(err, rows){
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }
    logger.debug(rows);
    return res.sendStatus(200);
  });
});


//
// generate participants
//
router.post('/edit/:cid/users/gen', getContestId, /*authJwt, roles('admin'),*/ function(req, res){

  //from csv
  if( typeis(req, ['multipart']) ){
    return csvUser(req, res, req.contestId);
  }

  return res.sendStatus(200);
});



//
// edit participants
//
router
  .route('/edit/:cid/users')
  .all(getContestId, authJwt, roles('admin'), OK())
  .get(getPage, function(req, res){

    var orderby = parseSortby(req);

    Contest.users(req.contestId, orderby, req.page, function(err, rows, pagination){
      if(err){
        logger.error(err);
        return res.status(500).json({ error: err.message });
      }

      logger.debug('contestants = ', rows);
      logger.debug(typeof rows);
      logger.debug(pagination);

      _.forEach(rows, function(c, i){
        rows[i].institute = entities.decodeHTML(rows[i].institute);
        rows[i].name = entities.decodeHTML(rows[i].name);
      });

      logger.debug('sort = ' + orderby);

      res.status(200).json({
        users: rows,
        pagination: pagination
      });
    });
  })
  .post(function(req, res){

    logger.debug(req.body);

    async.waterfall([
      function(callback){
        validateUserBody(req, false, callback);
      },
      function(callback){
        Contest.find(req.contestId, ['id'], function(err, rows){
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
        Contest.insertUser(req.contestId, {
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
        return res.status(500).json({ error: err.message });
      }
      return res.sendStatus(200);
    });
  })
  .put(function(req, res){

    if( !has(req.body,'id') ){
      logger.debug('no id');
      return res.sendStatus(400);
    }

    logger.debug(req.body);

    async.waterfall([
      function(callback){
        validateUserBody(req, true, callback);
      },
      function(callback){
        Contest.find(req.contestId, ['id'], function(err, rows){
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
        Contest.putUser(req.body.id, {
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
        return res.status(500).json({ error: err.message });
      }
      return res.sendStatus(200);
    });
  })
  .delete(function(req, res){

    var uid = req.query.user === 'all'
      ? req.query.user
      : [ req.query.user ];

    logger.debug('uid  =  ', uid);
    console.log(uid);

    Contest.deleteUser(req.contestId, uid, function(err, rows){
      if(err){
        logger.error(err);
        return res.status(500).json({ error: err.message });
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
  .all(getContestId, authJwt, roles('admin'), OK())
  .get(function(req, res){


    Contest.findProblems(req.contestId, ['id','title','status'], function(err, rows){
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
// contest details, announcement
//
router.get('/:cid', getContestId, authUser, function(req, res){

  var uid = has(req,'user') ? req.user.id : null;

  Contest.announcement(req.contestId, uid, function(err, data){
    if(err){
      logger.error(err);
      return res.sendStatus(500);
    }

    if( !data.length ){
      return res.sendStatus(404);
    }

    logger.debug(data);
    data = data[0];

    delete data.id;
    data.title = entities.decodeHTML(data.title);
    data.slug = entities.decodeHTML(data.slug);
    data.description = entities.decodeHTML(data.description);

    res.status(200).json(data);
  });
});



//
// contest problems and statictics
//
router.get('/:cid/dashboard', getContestId, authUser, function(req, res){
  var uid = has(req,'user') ? req.user.id : null;

  async.waterfall([
    function(callback){
      getInfo(req.contestId, uid, callback);
    },
    function(data, callback){
      //contest not yet started
      if( moment().isBefore(data.begin) ){
        return callback(new AppError('Contest is not started yet', 'NOT_AVAILABLE_YET'));
      }

      var isuser = uid && parseInt(data.joined) === 1 ? uid : null;

      Contest.dashboard(req.contestId, isuser, function(err, probs){
        if(err){
          return callback(err);
        }

        var notReady = 0;

        _.forEach(probs, function(c, i){
          //check if any of the problems is incomplete
          if( probs[i].status !== 'public' ){
            notReady++;
            return;
          }
          probs[i].name = alphabet.charAt(i);
          probs[i].id = problemHash.encode(probs[i].id);
          probs[i].title = entities.decodeHTML(probs[i].title);
          probs[i].slug = entities.decodeHTML(probs[i].slug);
        });

        //if any of the problems is incomplete, deny access
        if( notReady > 0 ){
          //logger.error('contest ' + req.contestId + '\'s ' + notReady + ' of + ' + probs.length + ' problem(s) is not ready but contest is public ');
          return callback(new AppError('Some problem is not ready', 'FORBIDDEN'));
        }

        return callback(null, data, probs);
      });
    }
  ],
  function(err, data, probs){
    if(err){
      return handleError(err, res);
    }

    console.log(probs);
    console.log(data);



    res.status(200).json({
      contest: data,
      problems: probs
    });
  });
});



//
// contest standings
//
router.get('/:cid/rank', getContestId, getPage, function(req, res){

  async.waterfall([
    function(callback){
      getInfo(req.contestId, null, callback);
    },
    function(data, callback){
      //contest not yet started
      if( moment().isBefore(data.begin) ){
        return callback(new AppError('Contest Not Yet Started','FORBIDDEN'));
      }

      Contest.rankStats(req.contestId, true, function(err, stats){
        if(err){
          return callback(err);
        }
        return callback(null, data, stats);
      });
    },
    function(data, stats, callback){
      Contest.rank({
        id: req.contestId,
        time: data.begin,
        cur_page: req.page,
        limit: 10,
        penalty: 20
      },
      function(err, ranks, pagination){
        if(err){
          return callback(err);
        }
        return callback(null, data, stats, ranks, pagination);
      });
    }
  ],
  function(err, data, stats, rank, pagination){
    if(err){
      return handleError(err, res);
    }

    _.forEach(rank, function(c,i){
      if( !c.problems ){
        rank[i].problems = [];
        return;
      }
      var p = JSON.parse('{' + c.problems + '}');
      var newp = [];
      _.forEach(stats, function(prob, probId){
        newp.push(p[prob.id] === undefined ? null : p[prob.id]);
      });
      rank[i].problems = newp;
    });

    _.forEach(stats, function(c,i){
      stats[i].id = problemHash.encode(stats[i].id);
      stats[i].name = alphabet.charAt(i);
      stats[i].title = entities.decodeHTML(stats[i].title);
    });

    logger.debug(stats);
    logger.debug(rank);

    res.status(200).json({
      contest: data,
      rank: rank,
      stats: stats,
      pagination: pagination
    });
  });
});



//
// contest problem
//
router
  .route('/:cid/p/:pid')
  .all(getContestId)
  .get(authUser, function(req, res){
    var uid = has(req,'user') ? req.user.id : null;
    var pid = problemHash.decode(req.params.pid);

    if(!pid || !pid.length){
      return res.status(404).json({ error: 'No Problem Found' });
    }

    async.waterfall([
      function(callback){
        getInfo(req.contestId, uid, callback);
      },
      function(data, callback){
        Contest.problem(req.contestId, pid[0], function(err, prob){
          if(err){
            return callback(err);
          }

          if(!prob.length){
            return callback(new AppError('No Problem Found', 'NOT_FOUND'));
          }
          prob = prob[0];

          if( prob.status !== 'public' ){
            return callback(new AppError('Problem not yet ready', 'FORBIDDEN'));
          }

          prob.title = entities.decodeHTML(prob.title);
          prob.slug = entities.decodeHTML(prob.slug);
          prob.input = entities.decodeHTML(prob.input);
          prob.output = entities.decodeHTML(prob.output);
          prob.statement = entities.decodeHTML(prob.statement);

          return callback(null, data, prob);
        });
      }
    ],
    function(err, data, prob){
      if(err){
        if( err.name === 'NOT_FOUND' || err.name === 'FORBIDDEN' ){
          return res.status(errorcode[err.name]).json({ error: err.message });
        }
        logger.error(err);
        return res.sendStatus(500);
      }

      logger.debug(data, prob);

      res.status(200).json({
        contest: data,
        problem: prob
      });
    });
  })
  .post(authJwt, Submit);




//
// contest submisisons
//
router.get('/:cid/submissions', getContestId, getPage, authUser, function(req, res, next) {
  var uid = has(req,'user') ? req.user.id : null;

  //for sql query where
  var where = {};

  //for user submissions
  if( has(req.query,'user') ){
    where['users.username'] = req.query.user;
  }

  //for problem submissions
  if( has(req.query,'problem') ){
    var pid = problemHash.decode(req.query.problem);
    //invalid problem hash
    if(!pid || !pid.length){
      return res.status(401).json({ error: 'No Problem Found' });
    }
    where['submissions.pid'] = pid[0];
  }

  //total submission to show
  var total = 50;
  if( has(req.query,'limit') && _.inRange(parseInt(req.query.limit), 1, 101) ){
    total = parseInt(req.query.limit);
  }

  logger.debug('where = ', where);

  async.waterfall([
    function(callback){
      getInfo(req.contestId, uid, callback);
    },
    function(data, callback){
      Contest.submissions(req.contestId, req.page, where, total, function(err, subs, pagination){
        if(err){
          return callback(err);
        }

        _.forEach(subs, function(sub, indx){
          subs[indx].pid = problemHash.encode(sub.pid);
          subs[indx].id = submissionHash.encode(sub.id);
        });

        return callback(null, data, subs, pagination);
      });
    }
  ],
  function(err, data, subs, pagination){
    if(err){
      return handleError(err, res);
    }

    logger.debug(data, subs, pagination);

    res.status(200).json({
      contest: data,
      subs: subs,
      pagination: pagination
    });
  });
});




//
// contest all clarifications
//
router
  .route('/:cid/clars')
  .all(getContestId)
  .get(getPage, authUser, function(req, res){
    var uid = has(req,'user') ? req.user.id : null;

    //for sql query where
    var where = {};

    //for user submissions
    if( has(req.query,'user') ){
      where['users.username'] = req.query.user;
    }

    //for problem submissions
    if( has(req.query,'problem') ){
      if( req.query.problem === 'general' ){
        where['cc.pid'] = null;
      }
      else{
        var pid = problemHash.decode(req.query.problem);
        //invalid problem hash
        if(!pid || !pid.length){
          return res.status(404).json({ error: 'No Problem Found' });
        }
        where['cc.pid'] = pid[0];
      }
    }

    async.waterfall([
      function(callback){
        getInfo(req.contestId, uid, callback);
      },
      function(data, callback){
        //contest not yet started
        if( moment().isBefore(data.begin) ){
          return callback(new AppError('Contest Not Yet Started','FORBIDDEN'));
        }

        Contest.clars({
          id: req.contestId,
          cur_page: req.page,
          where: where,
          limit: 10
        },
        function(err, clar, pagination){
          if(err){
            return callback(err);
          }

          return callback(null, data, clar, pagination);
        });
      }
    ],
    function(err, data, clars, pagination){
      if(err){
        return handleError(err, res);
      }

      logger.debug(clars, pagination);

      _.forEach(clars, function(c,i){
        clars[i].id = clarHash.encode(clars[i].id);
        clars[i].request = clarHash.encode(clars[i].request);
        clars[i].title = problemHash.encode(clars[i].title);
      });

      res.status(200).json({
        contest: data,
        clars: clars,
        pagination: pagination
      });
    });
  })
  .post(authJwt, function(req, res){

    async.waterfall([
      function(callback){
        getInfo(req.contestId, req.user.id, callback);
      },
      function(data, callback){
         //contest not yet started
        if( moment().isBefore(data.begin) ){
          return callback(new AppError('Contest Not Yet Started','FORBIDDEN'));
        }

        //user not participating in this contest
        if( parseInt(data.joined) === 0 ){
          return callback(new AppError('You are not participating in this contest','FORBIDDEN'));
        }

        req.sanitize('request').escapeInput();
        req
          .checkBody('problem', 'Invalid problem')
          .notEmpty().withMessage('Problem required');
        req
          .checkBody('request', 'Invalid Request text')
          .notEmpty().withMessage('Request text required')
          .isLength({ min: 0, max: 1500 }).withMessage('Request text may not be greater than 1500 characters.');

        req
          .getValidationResult()
          .then(function(result) {
            if (!result.isEmpty()){
              var e = result.array()[0];
              logger.debug('validation error: ', e);
              return fn(new AppError(e.msg, 'BAD_REQUEST'));
            }

            var pid = problemHash.decode(req.body.problem);
            if(!pid || !pid.length){
              return callback(new AppError('No problem Found','NOT_FOUND'));
            }

            return callback(null, pid[0]);
          });
      },
      function(pid, callback){
        Contest.saveClar({
          cid: req.contestId,
          uid: req.user.id,
          pid: pid,
          request: req.body.request,
          status: ''
        }, callback);
      }
    ],
    function(err){
      if(err){
        return handleError(err, res);
      }
      return res.sendStatus(200);
    });
  });



//
// respond to a clarification
//
router
  .route('/:cid/clar/admin')
  .all(getContestId, authJwt, roles('admin'))
  .get(OK('ok'))
  .post(function(req, res){
    //post a new clarification from admin

    async.waterfall([
      function(callback){
        req.sanitize('request').escapeInput();
        req
          .checkBody('request', 'Invalid Request text')
          .notEmpty().withMessage('Request text required')
          .isLength({ min: 0, max: 1500 }).withMessage('Request text may not be greater than 1500 characters.');

        req
          .getValidationResult()
          .then(function(result) {
            if (!result.isEmpty()){
              var e = result.array()[0];
              logger.debug('validation error: ', e);
              return fn(new AppError(e.msg, 'BAD_REQUEST'));
            }

            //general clars
            if( !has(req.body,'problem') ){
              return callback(null, null);
            }

            var pid = problemHash.decode(req.body.problem);
            if(!pid || !pid.length){
              return callback(new AppError('No problem Found','NOT_FOUND'));
            }

            return callback(null, pid[0]);
          });
      },
      function(pid, callback){
        Contest.saveClar({
          cid: req.contestId,
          uid: req.user.id,
          pid: pid,
          request: req.body.request,
          status: 'answered'
        }, callback);
      }
    ],
    function(err){
      if(err){
        return handleError(err, res);
      }
      return res.sendStatus(200);
    });
  })
  .put(function(req, res){
    //respond to a clarification

    //if ignore the clarification
    var ignore = has(req.query,'action') && req.query.action === 'ignore';

    async.waterfall([
      function(callback){
        req
          .checkBody('id', 'Invalid clar id')
          .notEmpty().withMessage('Clar id required');

        if( !ignore ){
          req.sanitize('response').escapeInput();
          req
            .checkBody('response', 'Invalid response text')
            .notEmpty().withMessage('Response text required')
            .isLength({ min: 0, max: 1500 }).withMessage('Response text may not be greater than 1500 characters.');
        }
        else{
          req.body.response = '';
        }

        req
          .getValidationResult()
          .then(function(result) {
            if (!result.isEmpty()){
              var e = result.array()[0];
              logger.debug('validation error: ', e);
              return fn(new AppError(e.msg, 'BAD_REQUEST'));
            }

            var clarId = clarHash.decode(req.body.id);
            if( !clarId || !clarId.length ){
              return callback(new AppError('No clarification Found','NOT_FOUND'));
            }

            return callback(null, clarId[0]);
          });
      },
      function(clarId, callback){
        Contest.putClar(clarId,{
          response: req.body.response,
          status: ignore ? 'ignored' : 'answered'
        }, callback);
      }
    ],
    function(err){
      if(err){
        return handleError(err, res);
      }
      return res.sendStatus(200);
    });

  })
  .delete(function(req, res){
    //delete a clarification

    var clarId = has(req.query,'clar') ? clarHash.decode(req.query.clar) : null;
    if( !clarId || !clarId.length ){
      return callback(new AppError('No clarification Found','NOT_FOUND'));
    }

    Contest.deleteClar(clarId[0], function(err){
      if(err){
        return handleError(err, res);
      }
      return res.sendStatus(200);
    });
  });


//
// contest clarification
//
router.get('/:cid/clar/:clarId', getContestId, authUser, function(req, res){
  var uid = has(req,'user') ? req.user.id : null;

  var clarId = clarHash.decode(req.params.clarId);
  if( !clarId || !clarId.length ){
    return res.status(404).json({ error: 'No clarification Found' });
  }

  async.waterfall([
    function(callback){
      getInfo(req.contestId, uid, callback);
    },
    function(data, callback){
      //contest not yet started
      if( moment().isBefore(data.begin) ){
        return callback(new AppError('Contest Not Yet Started','FORBIDDEN'));
      }

      Contest.clar(req.contestId, clarId[0], function(err, clar){
        if(err){
          return callback(err);
        }
        return callback(null, data, clar);
      });
    }
  ],
  function(err, data, clar){
    if(err){
      return handleError(err, res);
    }

    logger.debug(clar);

    res.status(200).json({
      contest: data,
      clar: clar
    });
  });
});



//
// get contest decoded data and also validate
//
function getInfo(cid, uid, fn){
  Contest.announcement(cid, uid, function(err, data){
    if(err){
      return fn(err);
    }

    if(!data.length){
      return fn(new AppError('No Contest Found', 'NOT_FOUND'));
    }

    data = data[0];

    //contest is not public
    if( parseInt(data.status) !== 2 ){
      return fn(new AppError('Conest is not public', 'FORBIDDEN'));
    }

    delete data.id;
    delete data.description;
    data.title = entities.decodeHTML(data.title);
    data.slug = entities.decodeHTML(data.slug);

    return fn(null, data);
  });
}






//
// validate insert user data
//
function validateUserBody(req, skip, fn){
  req.checkBody(Schema.randomuser);
  req.checkBody('username','already taken').userExists();

  logger.debug('validating inputs..');

  req
    .getValidationResult()
    .then(function(result) {
      if (!result.isEmpty()){
        var e = result.array()[0];
        logger.debug('validation error: ',e);

        if( e.param === 'username' && e.msg === 'required' && skip ){
          return fn();
        }

        return fn(new AppError(e.param + ' ' + e.msg,'input'));
      }

      return fn();
    });
};


//
//
//
function parseSortby(req){
  if( !has(req.query,'orderby') ){
    return null;
  }

  var orderby = _
    .chain(req.query.orderby)
    .split(',', 3)
    .filter(function userOrderFilter(column){
      return (column == 'institute' || column === 'name' || column === 'username'
              || column == '-institute' || column === '-name' || column === '-username');
    })
    .value();

  if( !orderby.length ){
    return 'institute, name';
  }

  return _
    .chain(orderby)
    .map(function(elem) {
      if( elem.charAt(0) === '-' ){
        return '`usr`.`'+ elem.substring(1) +'` DESC';
      }
      return '`usr`.`'+ elem +'`';
    })
    .join(',')
    .value();
}



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

