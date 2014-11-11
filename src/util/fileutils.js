global.Promise = global.Promise || require('es6-promise').Promise;
var fs = require('fs');

exports.getAppNames = function (baseDir) {
    return new Promise(function (resolve, reject) {
        fs.readdir(baseDir, function (err, files) {
            if (err != null) {
                reject(err);
                return;
            }
            filter(baseDir, files)
                .then(resolve)
                .catch(reject);
        });
    });
}

function filter(baseDir, files) {
    return Promise.all(files.map(function (file) {
        return new Promise(function (resolve, reject) {
            if (file === 'public') {
                resolve();
                return;
            }
            fs.stat(baseDir + '/' + file, function (err, stats) {
                if (err != null || !stats.isDirectory()) {
                    resolve();
                    return;
                }
                resolve(file);
            });
        });
    }))
        .then(function (list) {
            return list.filter(function (x) { return x != null; });
        });
}
