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

app.directive('opentickets', directives.simple(appRoot, 'opentickets'));
app.directive('inprogresstickets', directives.simple(appRoot, 'inprogresstickets'));

angular.bootstrap(document, ['app']);
