/// <reference path="./typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
var gulp = require('gulp');
var styl = require('gulp-styl');
var server = require('gulp-express');
var clean = require('gulp-clean');
require('require-dir')('./gulp');

gulp.task('default', function () {
    runSequence('build', 'serve');
});

gulp.task('clean', function () {
    return gulp.src(['app', '!dist/.git/**', 'dist/**/*'], { read: false })
        .pipe(clean());
});

gulp.task('build', ['ts', 'jade', 'styl', 'copy']);

gulp.task('build-release', ['clean'], function (callback) {
    runSequence(['ts-release', 'jade-release', 'styl', 'copy'], callback);
});

gulp.task('copy', function () {
    return gulp.src(['src/**/*.js', 'src/**/*.json', 'src/**/*.png'])
        .pipe(gulp.dest('app/'));
});

gulp.task('styl', function () {
    return gulp.src('src/**/*.styl')
        .pipe(styl())
        .pipe(gulp.dest('app/'));
});

gulp.task('serve', ['watch'], function () {
    server.run({
        file: 'app/server.js'
    });
});

gulp.task('watch', ['ts-watch'], function () {
    gulp.watch('src/**/*.jade', ['jade']);

    gulp.watch('src/**/*.styl', ['styl']);
    gulp.watch(['src/**/*.js', 'src/**/*.json'], ['copy']);

    gulp.watch(['app/**/*.html', 'app/**/*.css', 'app/*/public/**/*.js'], server.notify);
    gulp.watch(['app/**/*.js', '!app/*/public/**'], server.run);
});
