/// <reference path="./../../../../typings/tsd.d.ts"/>
import directives = require('./module/directives');

var appRoot = '/hayo/';

var app = angular.module('app', ['ngAnimate', 'ngCookies']);

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
        $locationProvider.html5Mode(true);
    }
]);

app.directive('ticket', directives.simple(appRoot, 'ticket'));
app.directive('newticket', directives.simple(appRoot, 'newticket'));
app.directive('catchedticket', directives.simple(appRoot, 'catchedticket'));

angular.bootstrap(document, ['app']);
