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
var git = require('gulp-git');

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

gulp.task('deploy', () => new Promise(
    (resolve, reject) =>
        gulp.src([
            'app/**', 'package.json',
            '!**/*.map', '!app/*/public/javascript/**'
        ])
            .pipe(gulp.dest('dist/'))
            .on('end', resolve)
    ).then(() => new Promise((resolve, reject) =>
        gulp.src('dist/**/*.*')
            .pipe(git.add())
            .pipe(git.commit('update'))
            .on('end', resolve))
    ).then(() => new Promise((resolve, reject) =>
        git.push('origin', 'master', (err: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        }))
    ));
