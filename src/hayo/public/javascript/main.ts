/// <reference path="./../../../../typings/tsd.d.ts"/>
import directives = require('./module/directives');

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
        $scope.openTickets = fromStorageData(sessionStorage.getItem('openTickets'));

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

        $http.get(apiRoot + 'tickets/')
            .then((result: { data: any[] }) => {
                updateList($scope.openTickets, result.data.map(fromDTO));
            })
            .catch(e => { });
    }]);

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
                $http.post(apiRoot + 'tickets/',
                    {
                        title: title,
                        isPost: $scope.isPost
                    })
                    .then((result: { data: any[] }) => {
                        updateList($scope.openTickets, result.data.map(fromDTO));
                    })
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

function updateList(openTickets: any[], list: any[]) {
    merge(openTickets, list);
    sessionStorage.setItem('openTickets', toStorageData(openTickets));
}

function fromDTO(dto: any) {
    return {
        id: dto.id,
        title: dto.title,
        username: dto.username,
        likes: dto.likes,
        createdAt: new Date(dto.createdAt),
        deletedAt: dto.deletedat == null ? null : new Date(dto.deletedat)
    };
}

function toStorageData(data: any[]) {
    return JSON.stringify(data.map(x => {
        var y: any;
        $.extend(y, x);
        delete y.$$hashKey;
        return y;
    }));
}
function fromStorageData(storageData: string) {
    var data: any[] = JSON.parse(storageData);
    if (data == null)
        return [];
    data.forEach(x => {
        x.createdAt = new Date(x.createdAt);
        x.deletedAt = x.deletedAt == null ? null : new Date(x.deletedAt);
    });
    return data;
}

/** aもbもid降順に並んでいるものとして、マージする */
function merge(a: { id: number }[], b: { id: number }[]) {
    var i = a.length - 1;
    for (var j = b.length - 1; j >= 0; j--) {
        var itemB = b[j];
        for (; ;) {
            if (i >= 0) {
                if (a[i].id === itemB.id) {
                    i--;
                    break;
                }
                if (a[i].id < itemB.id) {
                    i--;
                    continue;
                }
            }
            a.splice(i + 1, 0, itemB);
            break;
        }
    }
}

angular.bootstrap(document, ['app']);
