/// <reference path="../typings/tsd.d.ts"/>
global.Promise = global.Promise || require('es6-promise').Promise;
var childProcess = require('child_process');
var gulp = require('gulp');

gulp.task('deploy', ['build-release'], function () {
    return sequence(
    function (resolve, reject) {
        gulp.src('package.json')
            .pipe(gulp.dest('dist/'))
            .on('end', resolve);
    }, function (resolve, reject) {
        gulp.src([
            'app/**',
            '!**/*.map', '!app/*/public/javascript/**'
        ])
            .pipe(gulp.dest('dist/app/'))
            .on('end', resolve);
    }, function (resolve, reject) {
        var cmd = [
            'git add -A',
            'git commit -a -m "update"',
            'git push origin master'
        ].join('&&');
        childProcess.exec(cmd, { cwd: 'dist' },
            function (error, stdout, stderr) {
                console.log(stdout);
                console.error(stderr);
                if (error != null) {
                    reject(error);
                    return;
                }
                resolve();
            });
    });
});

function sequence() {
    var callbacks = [];
    for (var i = 0; i < arguments.length; i++) {
        callbacks[i] = arguments[i];
    }
    console.log(callbacks);
    return callbacks.reduce(
        function (promise, callback) {
            return promise.then(function () {
                return new Promise(callback);
            })
        },
        Promise.resolve());
}