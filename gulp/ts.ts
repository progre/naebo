/// <reference path="../typings/tsd.d.ts"/>
import gulp = require('gulp');
var runSequence = require('run-sequence');
var tsd = require('gulp-tsd');
var typescript: IGulpPlugin = require('gulp-tsc');
var rjs = require('gulp-requirejs');

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
