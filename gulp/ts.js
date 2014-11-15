var fs = require('fs');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var rjs = require('gulp-requirejs');
var uglify = require('gulp-uglify');
var fileUtils = require('../src/util/fileutils');

gulp.task('ts', function (callback) {
    runSequence(['ts-server', 'ts-client', 'js-copy'], callback);
});

gulp.task('ts-release', function (callback) {
    runSequence(['ts-server', 'ts-client', 'js-copy'], 'js-minify', 'js-requirejs', callback);
});

gulp.task('ts-server', function () {
    return gulp.src(['src/**/*.ts', '!src/*/public/**'])
        .pipe(sourcemaps.init())
        .pipe(typescript({ noImplicitAny: true }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/'));
});

gulp.task('ts-client', function () {
    return gulp.src('src/*/public/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(typescript({ module: 'amd', noImplicitAny: true }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/'))
});

gulp.task('ts-watch', function () {
    gulp.watch(['src/**/*.ts', '!src/*/public/**'], ['ts-server']);
    gulp.watch('src/*/public/**/*.ts', ['ts-client']);
});

gulp.task('js-copy', function () {
    return gulp.src('src/**/*.js')
        .pipe(gulp.dest('app/'));
});

gulp.task('js-minify', function () {
    return gulp.src(['app/*/public/javascript/**/*.js', '!**/config.js'])
        .pipe(uglify({ preserveComments: 'some' }))
        .pipe(gulp.dest('app/'));
});

gulp.task('js-requirejs', function () {
    return fileUtils.getAppNames('src')
        .then(function (apps) {
            return Promise.all(apps.map(function (app) {
                return new Promise(function (resolve, reject) {
                    var publicDir = 'app/' + app + '/public/';
                    fs.exists(publicDir + 'javascript/config.js', function (exists) {
                        if (!exists) {
                            return resolve();
                        }
                        rjs({
                            baseUrl: publicDir + 'javascript/',
                            name: 'main',
                            mainConfigFile: publicDir + 'javascript/config.js',
                            out: 'main.js'
                        })
                            .pipe(gulp.dest(publicDir + 'js/'));
                        resolve();
                    });
                });
            }))
        });
});
