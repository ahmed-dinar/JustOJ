var gulp            = require('gulp');
var rename          = require('gulp-rename');
var browserify      = require('browserify');
var livereload      = require('gulp-livereload');
var source          = require('vinyl-source-stream');
var glob            = require('glob');
var nodemon         = require('gulp-nodemon');
var notify          = require('gulp-notify');


var args = require('yargs').argv;
var nodeInspector = require('gulp-node-inspector');


gulp.task('test', function() {

    var testFiles = glob.sync('./test/**/*.js');

    return browserify({
        entries: testFiles
    })
        .bundle()
        .pipe(source('test-build.js'))
        .pipe(gulp.dest('build'));

});

gulp.task('test-view', ['test'], function() {
    return gulp.src('test/index.html')
        .pipe(livereload());
});


gulp.task('watch', function() {
    livereload.listen();
    gulp.watch('./test/**/*.js', ['test-view']);
});



gulp.task('debug', function () {
    gulp
        .src([])
        .pipe(nodeInspector({
            debugPort: 5858,
            webHost: 'localhost',
            webPort: 8080,
            preload: true
        }));
});





gulp.task('default', /*(args.debug) ? ['debug'] : null,*/ function () {

  //  livereload.listen();

    var nodemonExec = args.sudo ? 'sudo ' : '';
    nodemonExec +=  'NODE_ENV=development node ';

    var options = {
        script: 'server.js',
        ext: 'ejs js',
        exec: nodemonExec,
        nodeArgs: []
    };

    if (args.debug)
        options.nodeArgs.push('--debug-brk');

    nodemon(options)
        .on('crash', function () {
            console.log('script crashed for some reason');
        })
        .on('start', function () {
           // console.log('nodemon started!');
        })
        .on('restart', function () {

            gulp.src('server.js');
               // .pipe(livereload({ auto: false }));
                //.pipe(notify('Page Reloading...'));
        });
});
