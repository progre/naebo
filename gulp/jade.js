/// <reference path="../typings/tsd.d.ts"/>
var clone = require('clone');
var gulp = require('gulp');
var jade = require('gulp-jade');
var plumber = require('gulp-plumber');
var fileUtils = require('../src/util/fileutils');

gulp.task('jade', ['jade-root', 'jade-sub']);
gulp.task('jade-release', ['jade-root-release', 'jade-sub-release']);

gulp.task('jade-root', jadeRootTask(true));
gulp.task('jade-root-release', jadeRootTask(false));
function jadeRootTask(debug) {
    return function () {
        return gulp.src('src/public/**/*.jade')
            .pipe(plumber())
            .pipe(jade({ data: { debug: debug } }))
            .pipe(gulp.dest('app/public/'));
    };
}

gulp.task('jade-sub', jadeSubTask(true));
gulp.task('jade-sub-release', jadeSubTask(false));
function jadeSubTask(debug) {
    return function () {
        return fileUtils.getAppNames('src')
            .then(function (apps) {
                return parallel(apps.map(function (app) {
                    var data = {};
                    try {
                        data = require('../src/' + app + '/resources/ja.json');
                    } catch (ex) {
                    }
                    data.debug = debug;
                    data.appRoot = '/' + app + '/';
                    return gulp.src(['src/' + app + '/**/*.jade', '!**/template/**'])
                        .pipe(plumber())
                        .pipe(jade({ data: data }))
                        .pipe(gulp.dest('app/' + app));
                }));
            });
    };
}

function parallel(taskStreams) {
    return Promise.all(taskStreams.map(function (stream) {
        return new Promise(function (resolve, reject) {
            stream.on('end', resolve);
        });
    }));
}