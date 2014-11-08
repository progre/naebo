/// <reference path="../../../tsd.d.ts"/>

import directives = require('./module/directives');
import Server = require('./infrastructure/server');

var appRoot = '/hayo/';
var apiRoot = appRoot + 'api/1/';

var app = angular.module('app', ['ngAnimate', 'ngCookies']);

var server = new Server(apiRoot);

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
        $locationProvider.html5Mode(true);
    }
]);

app.directive('opentickets', directives.simple(appRoot, 'opentickets'));
app.directive('inprogresstickets', directives.simple(appRoot, 'inprogresstickets'));
app.directive('newticket', directives.simple(appRoot, 'newticket'));

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
        $scope.openTickets = server.cachedTickets();

        server.on('updated', (updateTickets: Function) => $scope.$apply(() => {
            console.log('update tickets');
            updateTickets($scope.openTickets);
        }));
        server.on('user', (user: any) => {
            $scope.user = user;
        });

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

        //var logoutExecuting = false;
        //$scope.logout = {
        //    execute: () => {
        //        console.log('logout..')
        //        if (logoutExecuting) {
        //            return;
        //        }
        //        logoutExecuting = true;
        //        server.logout()
        //            .then(() => {
        //                logoutExecuting = false;
        //            });
        //    },
        //    canExecute: () => {
        //        console.log('canecec')
        //        return !logoutExecuting;
        //    }
        //};
        $scope.logout = new PromiseCommand($scope, () =>
            server
                .logout()
                .then(() => {
                    $scope.user = null;
                }));
    }]);

class PromiseCommand {
    private executing = false;

    constructor(private $scope: any, private _execute: () => Promise<any>) {
    }

    execute() {
        if (this.executing) {
            return;
        }
        this.executing = true;
        this._execute()
            .then(() => {
                this.$scope.$apply(() => this.executing = false);
            })
            .catch(err => {
                console.error(err);
            });
    }

    canExecute() {
        return !this.executing;
    }
}

class StackablePromiseCommand {
    constructor(private _execute: Function) {
    }

    execute() {
    }
}

app.controller('NewTicketController', ['$http', '$scope',
    ($http: ng.IHttpService, $scope: any) => {
        $scope.open = () => $scope.isOpen = true;
        $scope.close = () => $scope.isOpen = false;

        var isExecuting = false;
        $scope.command = {
            execute: () => {
                isExecuting = true;
                var title: string = $scope.title;
                $scope.title = '';
                server.putTicket($http, title, $scope.isPost)
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
