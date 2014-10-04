/// <reference path="../../../../typings/tsd.d.ts"/>
import m2l = require('./domain/service/m2l');

var root = '/';

var app = angular.module('app', ['ngAnimate']);

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
    }
]);

app.service('onURLChanged', m2l.onURLChanged);
app.service('onTextChanged', m2l.onTextChanged);

app.controller('IndexCtrler', [
    '$scope', '$http', 'onURLChanged', 'onTextChanged',
    ($scope: any, $http: ng.IHttpService, onURLChanged: Function, onTextChanged: Function) => {
        $scope.$watch('url', () => onURLChanged($scope.url));
        $scope.$watch('text', () => onTextChanged($scope.text));
    }
]);

angular.bootstrap(document, ['app']);
