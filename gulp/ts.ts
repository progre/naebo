/// <reference path="../typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
import fs = require('fs');
import gulp = require('gulp');
var runSequence = require('run-sequence');
var tsd = require('gulp-tsd');
var typescript: IGulpPlugin = require('gulp-tsc');
var rjs = require('gulp-requirejs');
import fileUtils = require('../src/fileutils');

gulp.task('ts', callback => {
    runSequence('ts-tsd', ['ts-server', 'ts-client'], callback);
});

gulp.task('ts-release', callback => {
    runSequence('ts-tsd', ['ts-server', 'ts-client'], 'requirejs', callback);
});

gulp.task('ts-tsd', callback =>
    tsd({ command: 'reinstall', config: './tsd.json' }, callback));

gulp.task('ts-server', () =>
    gulp.src(['src/**/*.ts', '!src/*/public/**'])
        .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
        .pipe(gulp.dest('app/')));

gulp.task('ts-client', () =>
    gulp.src('src/*/public/**/*.ts')
        .pipe(typescript({ module: 'amd', noImplicitAny: true, sourcemap: true }))
        .pipe(gulp.dest('app/')));

gulp.task('ts-watch', () => {
    gulp.watch(['src/**/*.ts', '!src/*/public/**'], ['ts-server']);
    gulp.watch('src/*/public/**/*.ts', ['ts-client']);
});

gulp.task('requirejs', () =>
    fileUtils.getAppNames()
        .then(apps => Promise.all(apps.map(app => new Promise((resolve, reject) => {
            var publicDir = 'app/' + app + '/public/';
            fs.exists(publicDir + 'javascript/config.js', exists => {
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
        })))));
