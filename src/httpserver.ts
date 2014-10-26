import fs = require('fs');
import path = require('path');
import express = require('express');
require('express-resource');
var session: any = require('express-session');
var cookieParser: any = require('cookie-parser');
var livereload: any = require('connect-livereload');
import log4js = require('log4js');
var fileUtils = require('./fileutils');
import promises = require('./util/promises');
import sample = require('./sample/index');
import m2l = require('./m2l/index');

var logger = log4js.getLogger('server');
var accessLogger = log4js.getLogger('access');

export = HttpServer;
class HttpServer {
    private app = express();

    listen(port: number, localIp: string, debug: boolean) {
        if (debug) {
            this.app.use(livereload());
        }
        removeWWW(this.app);
        this.app.use(log);
        useSession(this.app);

        this.app.get('/m2l/api/1/lists/:screenName/:slug', m2l.lists.show);

        this.app.use(express.static(__dirname + '/public'));

        (<Promise<string[]>>fileUtils.getAppNames())
            .then(promises.each((appName: string) => {
                this.app.use('/' + appName, express.static(__dirname + '/' + appName + '/public'));
                var modulePath = './' + appName;
                var modul = tryRequire(modulePath);
                if (modul == null) {
                    return;
                }
                for (var key in modul) {
                    this.app.resource(appName + '/api/1/' + key, modul[key]);
                }
            }))
            .then(() => {
                var server = this.app.listen(port, localIp, () => {
                    logger.info('Listening on port %d', server.address().port);
                });
                log4js.getLogger('console').debug('debug mode.');// log4jsからコンソールへ何かしらの出力をしないと、grunt serveのwatchが効かなくなる
            });
    }
}

function removeWWW(app: express.Express) {
    app.get('/*', (req: express.Request, res: express.Response, next: () => void) => {
        if (req.host.match(/^www/) == null) {
            return next();
        }
        res.redirect('http://' + req.host.replace(/^www\./, '') + req.url);
    });
}

function log(req: express.Request, res: express.Response, next: () => void) {
    accessLogger.info([
        req.headers['x-forwarded-for'] || req.ip,
        new Date().toLocaleString(),
        req.method,
        req.url,
        res.statusCode,
        req.headers['referer'] || '-',
        req.headers['user-agent'] || '-'
    ].join('\t'));
    next();
}

function useSession(app: express.Express) {
    app.use(cookieParser('Heart Break'));
    app.use(session({ secret: 'Miserable Fate' }));
}

function tryRequire(path: string) {
    try {
        return require(path);
    } catch (e) {
        return null;
    }
}