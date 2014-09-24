/// <reference path="./typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
import childProcess = require('child_process');
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
var gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript = require('gulp-tsc');
var jade = require('gulp-jade');
var styl = require('gulp-styl');
var server = require('gulp-express');
var clean = require('gulp-clean');

gulp.task('default', () => {
    runSequence('build', 'serve');
});

gulp.task('build', ['ts', 'jade', 'styl']);
gulp.task('release-build', ['ts', 'release-jade', 'styl']);

gulp.task('ts', () => new Promise(
    (resolve, reject) => {
        tsd({ command: 'reinstall', config: './tsd.json' }, resolve);
    }).then(() => new Promise((resolve, reject) => {
        gulp.src('src/**/*.ts')
            .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
            .pipe(gulp.dest('app/'))
            .on('end', resolve);
    })));

gulp.task('jade', jadeTask(true));
gulp.task('release-jade', jadeTask(false));
function jadeTask(debug: boolean) {
    return () => gulp.src('src/**/*.jade')
        .pipe(jade({ data: { debug: debug } }))
        .pipe(gulp.dest('app/'));
}

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

gulp.task('clean', () =>
    gulp.src(['app', '!dist/.git/**', 'dist/**/*'], { read: false })
        .pipe(clean()));

gulp.task('deploy', () => sequence(
    (resolve, reject) => {
        runSequence(['clean'], ['release-build'], resolve);
    }, (resolve, reject) => {
        gulp.src('package.json')
            .pipe(gulp.dest('dist/'))
            .on('end', resolve);
    }, (resolve, reject) => {
        gulp.src([
            'app/**',
            '!**/*.map', '!app/*/public/javascript/**'
        ])
            .pipe(gulp.dest('dist/app/'))
            .on('end', resolve);
    }, (resolve, reject) => {
        var cmd = [
            'git add -A',
            'git commit -a -m "update"',
            'git push origin master'
        ].join('&&');
        childProcess.exec(cmd, { cwd: 'dist' },
            (error: Error, stdout: Buffer, stderr: Buffer) => {
                console.log(stdout);
                console.error(stderr);
                if (error != null) {
                    reject(error);
                    return;
                }
                resolve();
            });
    }));

function sequence(...callbacks: Array<(resolve, reject) => void>) {
    return callbacks.reduce(
        (promise: Promise<any>, callback: (resolve, reject) => void) =>
            promise.then(() => new Promise(callback)),
        Promise.resolve());
}