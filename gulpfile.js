var merge = require('event-stream').merge;
var Promise = require('es6-promise').Promise;
var gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript = require('gulp-tsc');
var jade = require('gulp-jade');
var styl = require('gulp-styl');
var server = require('gulp-express');
var runSequence = require('run-sequence');

gulp.task('build-ts', function () {
    return new Promise(function (resolve, reject) {
        tsd({ command: 'reinstall', config: './tsd.json' }, resolve);
    }).then(function () {
        return new Promise(function (resolve, reject) {
            gulp.src('src/**/*.ts')
                .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
                .pipe(gulp.dest('app/'))
                .on('end', resolve);
        });
    });
});

gulp.task('build-view', function () {
    return merge(
        gulp.src('src/**/*.jade')
            .pipe(jade())
            .pipe(gulp.dest('app/')),
        gulp.src('src/**/*.styl')
            .pipe(styl())
            .pipe(gulp.dest('app')));
});

gulp.task('serve', function (){
    server.run({
        file: 'app/server.js'
    });
    gulp.watch(['app/**/*.html', 'app/**/*.css'], server.notify);
    //gulp.watch('app/**/*.js', server.run);
    gulp.watch('app/**/*.html', function (event) {
        var fileName = require('path').relative(__dirname, event.path);
        console.log(fileName);
        server.notify(event);
    });
});

gulp.task('default', function () {
    runSequence('build-ts', 'build-view', 'serve');
});

// リリースビルド
// クリーン
// ビルド
