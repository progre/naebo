var Promise = require('es6-promise').Promise;
var gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript = require('gulp-tsc');
var jade = require('gulp-jade');
var styl = require('gulp-styl');
var server = require('gulp-express');

gulp.task('default', function () {
    // ビルド こけやすいものから定義した方がよさそうね
    // d.ts

    return new Promise(function (resolve, reject) {
        tsd({ command: 'reinstall', config: './tsd.json' }, resolve);
    }).then(function () {
        gulp.src('src/**/*.ts')
          .pipe(typescript({ noImplicitAny: true, sourcemap: true }))
          .pipe(gulp.dest('app2/'));
        gulp.src('src/**/*.jade')
          .pipe(jade())
          .pipe(gulp.dest('app2/'))
        gulp.src('src/**/*.styl')
          .pipe(styl())
          .pipe(gulp.dest('app2/'))
        // 単純なコピー
        server.run({
            file: 'app2/server.js'
        });
    });
    // ウォッチ
});

// リリースビルド
// クリーン
// ビルド
