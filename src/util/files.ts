import fs = require('fs');

export function mkdirIfNotExists(dir: string) {
    return new Promise((resolve, reject) => {
        fs.exists(dir, exists => {
            if (exists) {
                resolve();
                return;
            }
            return fs.mkdir(dir, '777', resolve);
        });
    });
}
