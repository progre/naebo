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
        this.socket.on('tickets', (tickets: any[]) => {
            this.emit('updated', (openTickets: any[]) => {
                merge(openTickets, tickets.map(fromDTO));
                sessionStorage.setItem('openTickets', toStorageData(openTickets));
            });
        });
        this.socket.on('user', (user: any) => {
            this.emit('user', user);
        });
    }

    cachedTickets() {
        return fromStorageData(sessionStorage.getItem('openTickets'));
    }

    putTicket($http: ng.IHttpService, title: string, isPost: boolean) {
        return $http.post(this.apiRoot + 'tickets/', {
            title: title,
            isPost: isPost
        });
    }

    logout() {
        return new Promise((resolve, reject) => {
            var guid = generateGuid();
            this.socket.once(guid, resolve);
            this.socket.emit('logout', guid);
        });
    }
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
