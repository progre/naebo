/// <reference path="../typings/tsd.d.ts"/>
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
            'git commit -a -m "update"'
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
    }, function (resolve, reject) {
        var push = childProcess.spawn('git', 'push origin master'.split(' '), { cwd: 'dist' });
        push.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        push.stderr.on('data', function (data) {
            console.error(data.toString());
        });
        push.on('close', function () {
            console.log('!!!FINISH!!!');
            resolve();
        });
    });
});

function sequence() {
    var callbacks = [];
    for (var i = 0; i < arguments.length; i++) {
        callbacks[i] = arguments[i];
    }
    return callbacks.reduce(
        function (promise, callback) {
            return promise.then(function () {
                return new Promise(callback);
            })
        },
        Promise.resolve());
}