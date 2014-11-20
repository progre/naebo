import EventEmitter2 = require('eventemitter2');
import Server = require('../../infrastructure/server');

class TicketRepos extends EventEmitter2 {
    constructor(private server: Server) {
        super();
        server.on('ticketsUpdated', (tickets: any) => {
            this.emit('updated', (openTickets: any[], inprogressTickets: any[], closeTickets: any[]) => {
                merge(openTickets, tickets.opens);
                removeStrayTickets(openTickets, tickets.opens);
                merge(inprogressTickets, tickets.inprogresses);
                removeStrayTickets(inprogressTickets, tickets.inprogresses);
                merge(closeTickets, tickets.closes);
                removeStrayTickets(closeTickets, tickets.closes);
                sessionStorage.setItem('openTickets', toStorageData(openTickets));
                sessionStorage.setItem('inprogressTickets', toStorageData(inprogressTickets));
                sessionStorage.setItem('closeTickets', toStorageData(closeTickets));
            });
        });
    }

    scopeOn(event: string, listener: Function, $scope: any) {
        this.on(event, () => safeApply($scope, listener.apply(this, arguments)));
    }

    cachedTickets() {
        return {
            opens: fromStorageData(sessionStorage.getItem('openTickets')),
            inprogresses: fromStorageData(sessionStorage.getItem('inprogressTickets')),
            closes: fromStorageData(sessionStorage.getItem('closeTickets')),
        };
    }

    putTicket(title: string, isPost: boolean) {
        return this.server.putTicket(title, isPost);
    }

    progress(ticketId: string) {
        return this.server.progress(ticketId);
    }
}

function safeApply($scope: any, func: Function) {
    var phase = $scope.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
        func();
    } else {
        $scope.$apply(func);
    }
}

function toStorageData(data: any[]) {
    return JSON.stringify(data.map(x => {
        var y: any = {};
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
                    mergeObject(a[i], itemB);
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

function mergeObject(a: any, b: any) {
    for (var key in b) {
        a[key] = b[key];
    }
}

function removeStrayTickets(a: { id: number }[], b: { id: number }[]) {
    var bIds = b.map(x => x.id);
    for (var i = a.length - 1; i >= 0; i--) {
        if (bIds.some(x => x === a[i].id)) {
            continue;
        }
        a.splice(i, 1);
    }
}

export = TicketRepos;
