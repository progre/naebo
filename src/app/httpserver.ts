import express = require('express');
require('express-resource');
var livereload = require('connect-livereload');
import log4js = require('log4js');
import routes = require('./routes');
import passport = require('./passport');
import SessionStore = require('./sessionstore');
interface IFileUtils { getAppNames(dir: string): Promise<string[]> }
var fileUtils: IFileUtils = require('../util/fileutils');

var logger = log4js.getLogger('server');
var accessLogger = log4js.getLogger('access');

class HttpServer {
    private app = express();

    listen(port: number, localIp: string, baseURL: string, dataDir: string, debug: boolean) {
        passport.init(baseURL);

        if (debug) {
            this.app.use(livereload());
        }
        removeWWW(this.app);
        this.app.use(log);
        var sessionStore = new SessionStore();
        sessionStore.use(this.app);
        passport.use(this.app);

        var server = this.app.listen(port, localIp, () => {
            logger.info('Listening on port %d', server.address().port);
        });
        fileUtils.getAppNames('app')
            .then(apps => {
                routes(server, this.app, sessionStore, dataDir, apps);
                log4js.getLogger('console').debug('debug mode.');// log4jsからコンソールへ何かしらの出力をしないと、grunt serveのwatchが効かなくなる
            })
            .catch(err => console.error(err.stack));
    }
}

function removeWWW(app: express.Express) {
    app.get('/*', (req: express.Request, res: express.Response, next: () => void) => {
        if (req.hostname.match(/^www/) == null) {
            return next();
        }
        res.redirect('http://' + req.hostname.replace(/^www\./, '') + req.url);
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

export = HttpServer;
