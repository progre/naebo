/// <reference path="../typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
import childProcess = require('child_process');
import gulp = require('gulp');

gulp.task('deploy', ['build-release'], () => sequence(
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