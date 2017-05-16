var express          = require('express');
var path             = require('path');
var favicon          = require('serve-favicon');
var morgan           = require('morgan');
var cookieParser     = require('cookie-parser');
var bodyParser       = require('body-parser');
var expressSession   = require('express-session');
var passport         = require('passport');
var flash            = require('connect-flash');
var io               = require('socket.io')();
var expressValidator = require('express-validator');

var roles            = require('./middlewares/userrole');

//routes
var routes        = require('./routes/index');
var login         = require('./routes/login');
var Logout        = require('./routes/logout');
var resister      = require('./routes/resister');
var problems      = require('./routes/problems');
var submit        = require('./routes/submit');
var user          = require('./routes/user');
var status        = require('./routes/status');
var ranks         = require('./routes/ranks');
var contest       = require('./routes/contest');
var ucheck        = require('./routes/ucheck');
var s3p           = require('./routes/s3');
var sockettest    = require('./routes/sockettest');
var auth          = require('./routes/auth');
var logger        = require('winston');
var nconf         = require('nconf');

require('./config/logger'); //init our logger settings

nconf.argv()
    .env('_')
    .file({ file: path.join(__dirname, 'config/config.json') });

var app = express();

app.disable('x-powered-by');

app.locals.site = {
    title: 'JUST OJ',
    url: 'http://localhost:8888/',
    description: 'SOMETHING'
};


// view engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//middlewares
app.use('$', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//sesssion
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'secretisalwayssecret',
    resave: false,
    saveUninitialized: false
}));


//passport authenticator
app.use(passport.initialize());
app.use(passport.session());
app.use(roles.middleware());
app.use(flash());


//authenticate login data
require('./middlewares/passport')(passport);


//routes
app.use('/', routes);
app.use('/login', login);
app.use('/logout', Logout);
app.use('/resister', resister);
app.use('/problems', problems);
app.use('/submit', submit);
app.use('/status', status);
app.use('/ranks', ranks);
app.use('/user', user);
app.use('/contests', contest);
app.use('/ucheck', ucheck);
app.use('/s3', s3p);
app.use('/sockettest', sockettest);
app.use('/auth', auth);


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
if (nconf.get('NODE:ENV') === 'development') {
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


/**
 * set port
 */
app.set('port', normalizePort(nconf.get('PORT') || '8888') ); //


/**
 * Create HTTP server.
 */
require('http').createServer(app);


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
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
}


module.exports = app;


