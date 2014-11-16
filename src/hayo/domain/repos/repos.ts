import clone = require('clone');
import promises = require('../../../util/promises');
import Database = require('../../infrastructure/database');
import Twitter = require('../../infrastructure/twitter');
import rps = require('./reposes');

var Ticket: {
    id: string;
    createdAt: Date;
    title: string;
    url: string;
    openUser: {
        provider: string;
        providerId: string;
        displayName: string;
    };
    progressUser: {
        provider: string;
        providerId: string;
        displayName: string;
    };
};

class Repos {
    private twitter = new Twitter();

    static new(dataDir: string) {
        return Database.new(dataDir)
            .then(database => new Repos(database));
    }

    constructor(public database: Database) {
    }

    tickets(type: rps.TicketType) {
        return this.database.tickets(type)
            .then(tickets => promises.map(tickets, x => {
                var ticket: typeof Ticket = <any>clone(x);
                return (
                    () => {
                        if (ticket.openUser == null)
                            return Promise.resolve<void>();
                        if (ticket.openUser.provider !== 'twitter')
                            throw new Error('Unsupported provider');
                        return this.twitter.getDisplayName(ticket.openUser.providerId)
                            .then(name => { ticket.openUser.displayName = name; });
                    })().then(() => {
                        if (ticket.progressUser == null)
                            return Promise.resolve<void>();
                        if (ticket.progressUser.provider !== 'twitter')
                            throw new Error('Unsupported provider');
                        return this.twitter.getDisplayName(ticket.progressUser.providerId)
                            .then(name => { ticket.progressUser.displayName = name; });
                    }).then(() => ticket);
            }));
    }
}

export = Repos;
