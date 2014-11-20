import EventEmitter2 = require('eventemitter2');

class Server extends EventEmitter2 {
    private socket = io({ path: '/hayo/socket.io' });
    constructor(
        private apiRoot: string
        ) {
        super();
        this.socket.on('connect', () => {
            console.log('connected');
        });
        this.socket.on('tickets', (tickets: any) => {
            tickets.opens.forEach(restore);
            tickets.inprogresses.forEach(restore);
            tickets.closes.forEach(restore);
            this.emit('ticketsUpdated', tickets);
        });
        this.socket.on('user', (user: any) => {
            this.emit('user', user);
        });
    }

    scopeOn(event: string, listener: Function, $scope: any) {
        this.on(event, () => safeApply($scope, listener.apply(this, arguments)));
    }

    emitMethod(event: string, ...args: any[]) {
        var argz = Array.prototype.slice.call(arguments).slice(1);
        return new Promise((resolve, reject) => {
            var guid = generateGuid();
            this.socket.once(guid, resolve);
            argz.unshift(event);
            argz.push(guid);
            this.socket.emit.apply(this.socket, argz);
        });
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

function restore(ticket: any) {
    ticket.createdAt = new Date(ticket.createdAt);
}

function generateGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export = Server;
