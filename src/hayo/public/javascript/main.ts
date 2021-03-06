﻿/// <reference path="../../../tsd.d.ts"/>

import PromiseCommand = require('./domain/entity/promisecommand');
import StackablePromiseCommand = require('./domain/entity/stackablepromisecommand');
import directives = require('./module/directives');
import Server = require('./infrastructure/server');
import TicketRepos = require('./domain/repos/ticketrepos');

var appRoot = location.pathname;

var app = angular.module('app', ['ngAnimate', 'ngCookies']);

var ticketRepos = new TicketRepos(new Server(appRoot));

app.config([
    '$locationProvider',
    ($locationProvider: ng.ILocationProvider) => {
        $locationProvider.html5Mode(true);
    }
]);

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
        var server = ticketRepos.server;
        server.scopeOn('user', (user: any) => {
            $scope.user = user;
        }, $scope);

        $scope.delete = new StackablePromiseCommand($scope,
            ticket => server.emitMethod('delete ticket', ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.openUser));

        $scope.likeOpen = new StackablePromiseCommand($scope,
            ticket => server.emitMethod('like open ticket', ticket.id),
            ticket => $scope.user != null);

        $scope.progress = new PromiseCommand($scope,
            (ticket, isPost) => server.emitMethod('progress ticket', ticket.id, isPost),
            null,
            ticket => $scope.user != null);

        $scope.likeInprogress = new StackablePromiseCommand($scope,
            ticket => server.emitMethod('like inprogress ticket', ticket.id),
            ticket => $scope.user != null);

        $scope.reverse = new PromiseCommand($scope,
            ticket => server.emitMethod('reverse ticket', ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

        $scope.complete = new PromiseCommand($scope,
            (ticket, url, isPost) => server.emitMethod('complete ticket', ticket.id, url, isPost),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

        $scope.reverseToInprogress = new PromiseCommand($scope,
            ticket => server.emitMethod('reverse to inprogress ticket', ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

        $scope.logout = new PromiseCommand($scope,
            () => server.emitMethod('logout')
                .then(() => {
                    $scope.user = null;
                }));
    }]);

app.controller('NewTicketController', ['$http', '$scope',
    ($http: ng.IHttpService, $scope: any) => {
        $scope.open = () => $scope.isOpen = true;
        $scope.close = () => $scope.isOpen = false;

        $scope.command = new PromiseCommand($scope,
            isPost => {
                var title: string = $scope.title;
                $scope.title = '';
                return ticketRepos.server.emitMethod('put ticket', title, isPost)
                    .then(() => {
                        $scope.close();
                    });
            });
    }]);

function equals(a: { provider: string; providerId: string; }, b: { provider: string; providerId: string; }) {
    return a.provider === b.provider && a.providerId === b.providerId;
}

angular.bootstrap(document, ['app']);
