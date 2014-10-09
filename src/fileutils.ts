import fs = require('fs');

var APPDIR = 'app/';

export function getAppNames() {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(APPDIR, (err, files) => {
            if (err != null) {
                reject(err);
                return;
            }
            filter(files)
                .then(resolve)
                .catch(reject);
        });
    });
}

function filter(files: string[]) {
    return Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
        if (file === 'public') {
            resolve();
            return;
        }
        fs.stat(APPDIR + file, (err, stats) => {
            if (err != null || !stats.isDirectory()) {
                resolve();
                return;
            }
            resolve(file);
        });
    }))).then(list => list.filter(x => x != null));
}
