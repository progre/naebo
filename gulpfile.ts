/// <reference path="./typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
import childProcess = require('child_process');
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
import gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript: IGulpPlugin = require('gulp-tsc');
var jade: IGulpPlugin = require('gulp-jade');
var styl: IGulpPlugin = require('gulp-styl');
var server = require('gulp-express');
var clean: IGulpPlugin = require('gulp-clean');
var rjs = require('gulp-requirejs');

gulp.task('default', () => {
    runSequence('build', 'serve');
});

gulp.task('build', ['typescript', 'jade', 'styl', 'copy']);
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

gulp.task('copy', () =>
    gulp.src(['src/**/*.js', 'src/**/*.json'])
        .pipe(gulp.dest('app/')));

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
    gulp.watch(['src/**/*.ts', '!src/*/public/**'], ['server-ts']);
    gulp.watch('src/*/public/**/*.ts', ['client-ts']);
    gulp.watch(['src/**/*.js', 'src/**/*.json'], ['copy']);

    gulp.watch(['app/**/*.html', 'app/**/*.css', 'app/*/public/**/*.js'], server.notify);
    gulp.watch(['app/**/*.js', '!app/*/public/**'], server.run);
});

gulp.task('clean', () =>
    gulp.src(['app', '!dist/.git/**', 'dist/**/*'], { read: false })
        .pipe(clean()));

gulp.task('deploy', ['release-build'], () => sequence(
    (resolve, reject) => {
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