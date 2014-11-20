/// <reference path="../../../tsd.d.ts"/>

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
            ticket => server.delete(ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.openUser));

        $scope.likeOpen = new StackablePromiseCommand($scope,
            ticket => server.likeOpen(ticket.id),
            ticket => $scope.user != null);

        $scope.progress = new PromiseCommand($scope,
            ticket => server.progress(ticket.id),
            null,
            ticket => $scope.user != null);

        $scope.likeInprogress = new StackablePromiseCommand($scope,
            ticket => server.likeInprogress(ticket.id),
            ticket => $scope.user != null);

        $scope.reverse = new PromiseCommand($scope,
            ticket => server.reverse(ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

        $scope.complete = new PromiseCommand($scope,
            (ticket, url) => server.complete(ticket.id, url),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

        $scope.reverseToInprogress = new PromiseCommand($scope,
            ticket => server.reverseToInprogress(ticket.id),
            null,
            ticket => $scope.user != null && equals($scope.user, ticket.progressUser));

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

function equals(a: { provider: string; providerId: string; }, b: { provider: string; providerId: string; }) {
    return a.provider === b.provider && a.providerId === b.providerId;
}

class PromiseCommand {
    private executing = false;

    constructor(
        private $scope: any,
        private _execute: (...args: any[]) => Promise<any>,
        private _isEnabled?: (...args: any[]) => boolean,
        private _isVisible?: (...args: any[]) => boolean) {
    }

    execute(...args: any[]) {
        if (!this.isVisible.apply(this, arguments)
            || !this.isEnabled.apply(this, arguments))
            return;
        this.executing = true;
        (<Promise<any>>this._execute.apply(this, args))
            .then(() => {
                this.$scope.$apply(() => this.executing = false);
            })
            .catch(err => {
                console.error(err.stack);
            });
    }

    isEnabled(...args: any[]) {
        return !this.executing
            && (this._isEnabled == null || this._isEnabled.apply(this, arguments));
    }

    isVisible(...args: any[]) {
        return this._isVisible == null || this._isVisible.apply(this, arguments);
    }
}

class StackablePromiseCommand {
    private executings: any[] = [];

    constructor(
        private $scope: any,
        private _execute: (arg: any) => Promise<any>,
        private _isEnabled?: (...args: any[]) => boolean,
        private _isVisible?: (...args: any[]) => boolean) {
    }

    execute(arg: any) {
        if (!this.isVisible(arg)
            || !this.isEnabled(arg))
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

    isEnabled(arg: any) {
        return this.executings.indexOf(arg) < 0
            && (this._isEnabled == null || this._isEnabled.apply(this, arguments));
    }

    isVisible(arg: any) {
        return this._isVisible == null || this._isVisible.apply(this, arguments);
    }
}

angular.bootstrap(document, ['app']);
