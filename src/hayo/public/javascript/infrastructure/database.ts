class Database {
    constructor(private apiRoot: string, private $http: ng.IHttpService) {
    }

    cachedTickets() {
        return fromStorageData(sessionStorage.getItem('openTickets'));
    }

    updateTickets(openTickets: any[]) {
        return this.$http.get(this.apiRoot + 'tickets/')
            .then((result: { data: any[] }) => {
                merge(openTickets, result.data.map(fromDTO));
                sessionStorage.setItem('openTickets', toStorageData(openTickets));
            });
    }

    putTicket(openTickets: any[], title: string, isPost: boolean) {
        return this.$http.post(this.apiRoot + 'tickets/',
            {
                title: title,
                isPost: isPost
            })
            .then((result: { data: any[] }) => {
                merge(openTickets, result.data.map(fromDTO));
                sessionStorage.setItem('openTickets', toStorageData(openTickets));
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

export = Database;