/// <reference path="./../../../../typings/tsd.d.ts"/>
import directives = require('./module/directives');
import Database = require('./infrastructure/database');

var appRoot = '/hayo/';
var apiRoot = appRoot + 'api/1/';

var app = angular.module('app', ['ngAnimate', 'ngCookies']);

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
        $locationProvider.html5Mode(true);
    }
]);

app.directive('opentickets', directives.simple(appRoot, 'opentickets'));
app.directive('inprogresstickets', directives.simple(appRoot, 'inprogresstickets'));
app.directive('newticket', directives.simple(appRoot, 'newticket'));

interface ICommand {
    execute(): void;
    canExecute(): boolean;
    isExecuting(): boolean;
}

app.filter('dateToDisplay', [() => (date: Date) => {
    if (date == null)
        return '';
    var localDate = new Date(date.getTime());
    localDate.setHours(localDate.getHours() + 9);
    return '' + localDate.getUTCFullYear() + '年' + (localDate.getUTCMonth() + 1) + '月' + localDate.getUTCDate() + '日 '
        + localDate.getUTCHours() + ':' + minutes(localDate.getUTCMinutes()) // yyyy年M月d日 H:mm
}]);

function minutes(min: number) {
    return min < 10 ? '0' + min : min.toString();
}

app.controller('IndexController', ['$timeout', '$http', '$scope',
    ($timeout: ng.ITimeoutService, $http: ng.IHttpService, $scope: any) => {
        var database = new Database(apiRoot, $http);
        $scope.openTickets = database.cachedTickets();

        var deleteExecutings: any[] = [];
        $scope.deleteCommand = {
            execute: (ticket: any) => {
                deleteExecutings.push(ticket);
                $timeout(() => {
                    ticket.deletedAt = new Date();
                    deleteExecutings = deleteExecutings.filter(x => x !== ticket);
                }, 1000);
            },
            canExecute: (ticket: any) => {
                return deleteExecutings.indexOf(ticket) < 0;
            }
        };
        var revertExecutings: any[] = [];
        $scope.revertCommand = {
            execute: (ticket: any) => {
                revertExecutings.push(ticket);
                $timeout(() => {
                    ticket.deletedAt = null;
                    revertExecutings = revertExecutings.filter(x => x !== ticket);
                }, 1000);
            },
            canExecute: (ticket: any) => {
                return revertExecutings.indexOf(ticket) < 0;
            }
        };

        database.updateTickets($scope.openTickets);
    }]);

app.controller('NewTicketController', ['$http', '$scope',
    ($http: ng.IHttpService, $scope: any) => {
        var database = new Database(apiRoot, $http);
        $scope.open = () => $scope.isOpen = true;
        $scope.close = () => $scope.isOpen = false;

        var isExecuting = false;
        $scope.command = {
            execute: () => {
                isExecuting = true;
                var title: string = $scope.title;
                $scope.title = '';
                database.putTicket($scope.openTickets, title, $scope.isPost)
                    .catch(e => { })
                    .then(() => {
                        isExecuting = false;
                        $scope.close();
                    });
            },
            canExecute: () => {
                return !isExecuting;
            }
        };
    }]);





angular.bootstrap(document, ['app']);
