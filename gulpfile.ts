/// <reference path="./typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
import gulp = require('gulp');
var jade: IGulpPlugin = require('gulp-jade');
var styl: IGulpPlugin = require('gulp-styl');
var server = require('gulp-express');
var clean: IGulpPlugin = require('gulp-clean');
require('require-dir')('./gulp');

gulp.task('default', () => {
    runSequence('build', 'serve');
});

gulp.task('clean', () =>
    gulp.src(['app', '!dist/.git/**', 'dist/**/*'], { read: false })
        .pipe(clean()));

gulp.task('build', ['ts', 'jade', 'styl', 'copy']);

gulp.task('build-release', ['clean'], callback =>
    runSequence(['ts-release', 'jade-release', 'styl', 'copy'], callback));

gulp.task('copy', () =>
    gulp.src(['src/**/*.js', 'src/**/*.json'])
        .pipe(gulp.dest('app/')));

gulp.task('jade', jadeTask(true));
gulp.task('jade-release', jadeTask(false));
function jadeTask(debug: boolean) {
    return () => gulp.src('src/**/*.jade')
        .pipe(jade({ data: { debug: debug } }))
        .pipe(gulp.dest('app/'));
}

gulp.task('styl', () =>
    gulp.src('src/**/*.styl')
        .pipe(styl())
        .pipe(gulp.dest('app/')));

gulp.task('serve', ['watch'], () => {
    server.run({
        file: 'app/server.js'
    });
});

gulp.task('watch', ['ts-watch'], () => {
    gulp.watch('src/**/*.jade', ['jade']);
    gulp.watch('src/**/*.styl', ['styl']);
    gulp.watch(['src/**/*.js', 'src/**/*.json'], ['copy']);

    gulp.watch(['app/**/*.html', 'app/**/*.css', 'app/*/public/**/*.js'], server.notify);
    gulp.watch(['app/**/*.js', '!app/*/public/**'], server.run);
});
