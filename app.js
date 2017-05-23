'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var io = require('socket.io')();
var _ = require('lodash');
var expressValidator = require('express-validator');
var logger = require('winston');
var nconf = require('nconf');
var chalk = require('chalk');

var roles = require('./middlewares/userrole');

/**
 * setup env, argv and file configuration
 * Also setup logger
 */
module.exports.setupConfig = function () {

  console.log( chalk.cyan('Loading and setup configs...') );

  nconf
    .argv()
    .env('_');
  global.env = nconf.get('NODE:ENV') || 'development';

  var configPath = path.join(__dirname, 'config/env/' + global.env + '.json');

    //check if config file exists.Otherwise exit node process for security.
    //NOTE: really exit? or use default config somehow??
  if( !fs.existsSync(configPath) ){
    console.log( chalk.bold.red('"' + configPath + '" config file not found.Please check.') );
    process.exit(1);
  }else {
    nconf.file({ file: configPath });
  }

  require('./config/logger'); //init our logger settings
};



/**
 * Load express view engine
 * @param app
 */
module.exports.loadViewEngine = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
};


/**
 * Load express Middlewares
 * @param app
 */
module.exports.loadMiddleware = function (app) {

  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

    //stream morgan logger to winston logger
  app.use( morgan('dev', { stream: {
    write: function(message){
      logger.info(message.slice(0, -1));
    }
  }}));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(expressSession({
    secret: nconf.get('SESSION:SECRET') || 'secretisalwayssecret',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(roles.middleware());
  app.use(flash());

  require('./middlewares/passport')(passport);  //authenticate login data
};


/**
 * Load express client routes
 * @param app
 */
module.exports.loadRoutes = function (app) {

  var routeList = ['login','logout','resister','problems','submit','user','status','ranks','contests','ucheck','s3','sockettest','auth'];

    //home route
  app.use('/', require('./routes/index') );

  _.forEach(routeList, function(routeName) {
    app.use('/' + routeName, require('./routes/' + routeName) );
  });
};


/**
 * Load error routes
 * @param app
 */
module.exports.loadErrorRoutes = function (app) {

    // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });


    // csurf error handlers
  app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);

        // handle CSRF token errors here
    res.status(403);
    res.send('Session expired');
  });


    // development error handler
    // will print stacktrace
  if (global.env === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }


    // production error handler
    // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
};


/**
 * Normalize a port into a number, string, or false.
 * @param val
 * @returns {*}
 */
module.exports.normalizePort = function (val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
        // named pipe
    return val;
  }

  if (port >= 0) {
        // port number
    return port;
  }

  return false;
};


/**
 * Create express server based on ssl or not
 * @param app
 */
module.exports.initServer = function (app) {

    //set port for express app server
  app.set('port', this.normalizePort( nconf.get('PORT') || '3000') );

    /*
    if ( nconf.get('ssl') ) {

        if( !fs.existsSync(nconf.get('ssl:key')) || !fs.existsSync(nconf.get('ssl:cert')) ){
            logger.error('SSL cert file or key file is missing, creating server in non-SSL mode...');
            require('http').createServer(app);
            return;
        }

        var sslCred = {
            key: fs.readFileSync( nconf.get('ssl:key') ),
            cert: fs.readFileSync( nconf.get('ssl:cert') )
        };

        logger.info('creating server in SSL mode....');
        require('https').createServer(sslCred, app);

    } else {*/
  logger.warn('creating server in non-SSL mode...');
  require('http').createServer(app);
    //}
};


/**
 * Initialize and load express application, {base function}
 * @returns {*|Function}
 */
module.exports.init = function () {

  var _this = this;

    //setup env ,argv and file configuration , load logger
  _this.setupConfig();

  var app = express();

    //disable powered by to hide technology on websites from wappalyzer and similar app
  app.disable('x-powered-by');

    //load express view engine
  _this.loadViewEngine(app);

    //load express Middlewares
  _this.loadMiddleware(app);

    //load client default routes
  _this.loadRoutes(app);

    //load express error route
  _this.loadErrorRoutes(app);

    //create express server
  _this.initServer(app);

  return app;
};