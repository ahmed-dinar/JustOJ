var express          = require('express');
var path             = require('path');
var favicon          = require('serve-favicon');
var logger           = require('morgan');
var cookieParser     = require('cookie-parser');
var bodyParser       = require('body-parser');
var expressSession   = require('express-session');
var passport         = require('passport');
var flash            = require('connect-flash');




//routes
var routes        = require('.//routes/index');
var login         = require('./routes/login');
var Logout        = require('.//routes/logout');
var resister      = require('.//routes/resister');
var problems      = require('./routes/problems');
var status        = require('./routes/status');
var ranks         = require('./routes/ranks');
var ucheck        = require('./routes/ucheck');
var verify        = require('./routes/verify');
var addproblem    = require('./routes/addproblem');
var s3p           = require('./routes/s3');


var app = express();


app.locals.site = {
    title: 'JUST OJ',
    url: 'http://localhost:8888/',
    description: 'SOMETHING'
};


// view engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('$', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



//sesssion
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'dinar',
    resave: false,
    saveUninitialized: false
}));


//passport authenticator
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//authemticate login data
require('./middlewares/passport')(passport);



//routes
app.use('/', routes);
app.use('/login', login);
app.use('/logout', Logout);
app.use('/resister', resister);
app.use('/problems', problems);
app.use('/status', status);
app.use('/ranks', ranks);
app.use('/ucheck', ucheck);
app.use('/verify', verify);
app.use('/addproblem', addproblem);
app.use('/s3', s3p);


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
if (app.get('env') === 'development') {
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


module.exports = app;
