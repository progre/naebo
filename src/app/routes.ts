import http = require('http');
import express = require('express');
import socketIO = require('socket.io');
import promises = require('../util/promises');
import files = require('../util/files');
import m2l = require('../m2l/index');
import passport = require('./passport');
import SessionStore = require('./sessionstore');

function routes(server: http.Server, app: express.Express, sessionStore: SessionStore, dataDir: string, apps: string[]) {
    passport.routes(app);
    app.use(express.static(__dirname + '/../public'));

    app.get('/m2l/api/1/lists/:screenName/:slug', m2l.lists.show);

    Promise.all(apps.map(appName => {
        var modul = tryRequire('../' + appName);
        if (modul == null)
            return;
        app.use('/' + appName, express.static(__dirname + '/../' + appName + '/public'));
        return load(server, app, sessionStore, dataDir, appName, modul)
            .then(m => {
                for (var key in m) {
                    app.resource(appName + '/api/1/' + key, m[key]);
                }
            });
    })).catch(err => console.error(err.stack));
}

function load(
    server: http.Server,
    app: express.Express,
    sessionStore: SessionStore,
    dataDir: string,
    appName: string,
    modul: any
    ) {
    if (!(modul instanceof Function)) {
        return Promise.resolve(modul);
    }
    var router = express.Router();
    var appDataDir = dataDir + appName + '/';
    return files.mkdirIfNotExists(appDataDir)
        .then(() => {
            var resources = modul({
                router: router,
                io: socketIO(server, { path: '/' + appName + '/socket.io' }),
                sessionStore: sessionStore,
                dataDir: appDataDir
            });
            app.use('/' + appName, router);
            return Promise.resolve(resources);
        });
}

function tryRequire(path: string) {
    try {
        return require(path);
    } catch (e) {
        return null;
    }
}

export = routes;
