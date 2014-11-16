﻿/// <reference path="../../../tsd.d.ts"/>

import directives = require('./module/directives');
import Server = require('./infrastructure/server');
import TicketRepos = require('./domain/repos/ticketrepos');

var appRoot = '/hayo/';
var apiRoot = appRoot + 'api/1/';

var app = angular.module('app', ['ngAnimate', 'ngCookies']);

var server = new Server(apiRoot);
var ticketRepos = new TicketRepos(server);

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
        $locationProvider.html5Mode(true);
    }
]);

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

app.controller('IndexController', ['$http', '$scope',
    ($http: ng.IHttpService, $scope: any) => {
        var cache = ticketRepos.cachedTickets();
        $scope.openTickets = cache.opens;
        $scope.inprogressTickets = cache.inprogresses;
        $scope.closeTickets = cache.closes;

        ticketRepos.scopeOn('updated', (updateTickets: Function) => {
            console.log('update tickets');
            updateTickets($scope.openTickets, $scope.inprogressTickets, $scope.closeTickets);
        }, $scope);
        server.scopeOn('user', (user: any) => {
            $scope.user = user;
        }, $scope);

        $scope.delete = new StackablePromiseCommand($scope,
            ticketId => server.delete(ticketId));

        $scope.progress = new PromiseCommand($scope,
            ticketId => server.progress(ticketId));

        $scope.reverse = new PromiseCommand($scope,
            ticketId => server.reverse(ticketId));

        $scope.complete = new PromiseCommand($scope,
            (ticketId, url) => server.complete(ticketId, url));

        $scope.logout = new PromiseCommand($scope,
            () => server.logout()
                .then(() => {
                    $scope.user = null;
                }));
    }]);

app.controller('NewTicketController', ['$http', '$scope',
    ($http: ng.IHttpService, $scope: any) => {
        $scope.open = () => $scope.isOpen = true;
        $scope.close = () => $scope.isOpen = false;

        $scope.command = new PromiseCommand($scope, () => {
            var title: string = $scope.title;
            $scope.title = '';
            return ticketRepos.putTicket(title, $scope.isPost)
                .then(() => {
                    $scope.close();
                }).catch(e => { });
        });
    }]);

class PromiseCommand {
    private executing = false;

    constructor(private $scope: any, private _execute: (...args: any[]) => Promise<any>) {
    }

    execute(...args: any[]) {
        if (this.executing) {
            return;
        }
        this.executing = true;
        (<Promise<any>>this._execute.apply(this, args))
            .then(() => {
                this.$scope.$apply(() => this.executing = false);
            })
            .catch(err => {
                console.error(err.stack);
            });
    }

    canExecute() {
        return !this.executing;
    }
}

class StackablePromiseCommand {
    private executings: any[] = [];

    constructor(private $scope: any, private _execute: (arg: any) => Promise<any>) {
    }

    execute(arg: any) {
        if (!this.canExecute(arg))
            return;
        this.executings.push(arg);
        this._execute(arg)
            .then(() => {
                this.$scope.$apply(
                    () => this.executings
                        = this.executings.filter(x => x !== arg));
            })
            .catch(err => {
                console.error(err.stack);
            });
    }

    canExecute(arg: any) {
        return this.executings.indexOf(arg) < 0;
    }
}

angular.bootstrap(document, ['app']);
