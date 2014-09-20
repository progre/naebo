import fs = require('fs');
import path = require('path');
import express = require('express');
require('express-resource');
var session: any = require('express-session');
var cookieParser: any = require('cookie-parser');
var livereload: any = require('connect-livereload');
import log4js = require('log4js');
import SubApplication = require('./subapplication');
import sample = require('./sample/index');

var logger = log4js.getLogger('server');
var accessLogger = log4js.getLogger('access');

export = HttpServer;
class HttpServer {
    private app = express();

    listen(port: number, localIp: string) {
        if (livereload != null) {
            this.app.use(livereload());
        }
        removeWWW(this.app);
        this.app.use(log);
        useSession(this.app);

        sample.use(new SubApplication('sample', this.app));

        this.app.use(express.static(__dirname + '/public'));

        var server = this.app.listen(port, localIp, () => {
            logger.info('Listening on port %d', server.address().port);
        });
        log4js.getLogger('console').debug('debug mode.');// log4jsからコンソールへ何かしらの出力をしないと、grunt serveのwatchが効かなくなる
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
