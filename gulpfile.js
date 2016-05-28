var gulp            = require('gulp');
var rename          = require('gulp-rename');
var browserify      = require('browserify');
var livereload      = require('gulp-livereload');
var source          = require('vinyl-source-stream');
var glob            = require('glob');
var nodemon         = require('gulp-nodemon');
var notify          = require('gulp-notify');

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


gulp.task('nodemon_restart', function () {

    livereload.listen();

    nodemon({
             script: 'bin/www',
             ext: 'ejs js',
             exec: 'sudo node'
        })
        .on('crash', function () {
            console.log('script crashed for some reason');
        })
        .on('restart', function () {
            gulp.src('bin/www')
                .pipe(livereload());
                //.pipe(notify('Page Reloading...'));
        });

});