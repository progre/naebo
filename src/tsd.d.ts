/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/angularjs/angular-route.d.ts" />
/// <reference path="../typings/cookie-parser/cookie-parser.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/gulp/gulp.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/log4js/log4js.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/passport/passport.d.ts" />
/// <reference path="../typings/sequelize/sequelize.d.ts" />
/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/socket.io-client/socket.io-client.d.ts" />

declare module 'eventemitter2' {
    import events = require('events');
    class EventEmitter2 extends events.EventEmitter { }

    export = EventEmitter2;
}
