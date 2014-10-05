/// <reference path="../typings/tsd.d.ts"/>
import gulp = require('gulp');
var runSequence = require('run-sequence');
var tsd = require('gulp-tsd');
var typescript: IGulpPlugin = require('gulp-tsc');
var rjs = require('gulp-requirejs');

gulp.task('release-build', ['clean'], callback =>
    runSequence(['release-typescript', 'release-jade', 'styl', 'copy'], callback));

gulp.task('typescript', callback => {
    runSequence('tsd', ['server-ts', 'client-ts'], callback);
});
gulp.task('release-typescript', callback => {
    runSequence('tsd', ['server-ts', 'client-ts'], 'requirejs', callback);
});

gulp.task('tsd', callback =>
    tsd({ command: 'reinstall', config: './tsd.json' }, callback));

gulp.task('server-ts', () =>
    gulp.src(['src/**/*.ts', '!src/*/public/**'])
        .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
        .pipe(gulp.dest('app/')));

gulp.task('client-ts', () =>
    gulp.src('src/*/public/**/*.ts')
        .pipe(typescript({ module: 'amd', noImplicitAny: true, sourcemap: true }))
        .pipe(gulp.dest('app/')));

gulp.task('requirejs', callback => {
    rjs({
        baseUrl: 'app/m2l/public/javascript/',
        name: 'main',
        mainConfigFile: 'app/m2l/public/javascript/config.js',
        out: 'main.js'
    })
        .pipe(gulp.dest('app/m2l/public/js/'));
    callback();
});
