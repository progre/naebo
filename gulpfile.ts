/// <reference path="./typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
var gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript = require('gulp-tsc');
var jade = require('gulp-jade');
var styl = require('gulp-styl');
var server = require('gulp-express');
var exec = require('gulp-exec');

gulp.task('default', () => {
    runSequence('build', 'serve');
});

gulp.task('build', ['ts', 'jade', 'styl']);

gulp.task('ts', () => new Promise(
    (resolve, reject) => {
        tsd({ command: 'reinstall', config: './tsd.json' }, resolve);
    }).then(() => new Promise((resolve, reject) => {
        gulp.src('src/**/*.ts')
            .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
            .pipe(gulp.dest('app/'))
            .on('end', resolve);
    })));

gulp.task('jade', () =>
    gulp.src('src/**/*.jade')
        .pipe(jade())
        .pipe(gulp.dest('app/')));

gulp.task('styl', () =>
    gulp.src('src/**/*.styl')
        .pipe(styl())
        .pipe(gulp.dest('app/')));

gulp.task('serve', () => {
    server.run({
        file: 'app/server.js'
    });

    gulp.watch('src/**/*.jade', ['jade']);
    gulp.watch('src/**/*.styl', ['styl']);

    gulp.watch(['app/**/*.html', 'app/**/*.css'], server.notify);
    gulp.watch('app/**/*.js', server.run);
});

gulp.task('deploy-copy', () =>
    gulp.src([
        'app/**', 'package.json',
        '!**/*.map', '!app/*/public/javascript/**'
    ])
        .pipe(gulp.dest('dist/'))
    );
gulp.task('deploy-git', ['deploy-copy'], () => {
    var stream = gulp.src('./dist/**/**');
    [
        'cd dist/',
        'git add -A',
        'git commit -a -m "update"',
        'git push origin master',
    ].forEach(x => {
            stream = stream.pipe(exec(x));
        });
    return stream;
});
gulp.task('deploy', ['deploy-git'], function () {
    console.log('done');
});
