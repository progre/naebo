/// <reference path="tsd.d.ts"/>
require('es6-shim');
require('source-map-support').install();
import log4js = require('log4js');
import openShift = require('./app/openshift');
import HttpServer = require('./app/httpserver');
import files = require('./util/files');

var BASE_URL = 'http://apps.prgrssv.net';

function main() {
    var LOG_DIRECTORY = openShift.dataDir + 'log';
    files.mkdirIfNotExists(openShift.dataDir)
        .then(() => files.mkdirIfNotExists(LOG_DIRECTORY))
        .then(() => {
            log4js.configure({
                appenders: [
                    {
                        category: 'access',
                        type: 'dateFile',
                        filename: LOG_DIRECTORY + '/access.log',
                        pattern: '-yyyy-MM-dd'
                    },
                    {
                        category: 'server',
                        type: 'dateFile',
                        filename: LOG_DIRECTORY + '/server.log',
                        pattern: '-yyyy-MM-dd'
                    },
                    {
                        category: 'console',
                        type: 'console'
                    }
                ]
            });
            new HttpServer().listen(
                openShift.port,
                openShift.localIp,
                openShift.debug ? 'http://127.0.0.1:8080' : 'http://apps.prgrssv.net',
                openShift.dataDir,
                openShift.debug);
        });
}

main();

