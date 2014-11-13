/// <reference path="../tsd.d.ts" />

import express = require('express');
import callbacks = require('../util/callbacks');
import SessionStore = require('../app/sessionstore');
import tickets = require('./resource/tickets');
import Database = require('./infrastructure/database');
import dbs = require('./infrastructure/databases');

class Hayo {
    static new(
        app: express.IRouter<void>,
        io: SocketIO.Server,
        sessionStore: SessionStore,
        dataDir: string
        ) {
        return Database.create(dataDir)
            .then(database => new Hayo(app, io, sessionStore, database));
    }

    constructor(
        private app: express.IRouter<void>,
        private io: SocketIO.Server,
        private sessionStore: SessionStore,
        private database: Database) {

        app.get('/auth', (req: express.Request, res: express.Response) => {
            var session = (<any>req).session;
            session.auth = session.auth || {};
            session.auth.callbackTo = req.originalUrl + '/callback';
            session.save();
            res.redirect('/auth/twitter/');
        });
        app.get('/auth/callback', (req: express.Request, res: express.Response) => {
            // 仮投稿したものがあれば確定する
            res.redirect('../');
        });
        io.on('connect', callbacks.tryFunc(socket => this.connect(socket)));
    }

    routes() {
        return {
            tickets: tickets(this.io, this.database)
        };
    }

    private connect(socket: SocketIO.Socket) {
        console.log('connected');
        (<Promise<any>>this.sessionStore.get(socket.request))
            .then(session => {
                return initSocket(socket, this.io, session, this.database);
            })
            .catch(err => console.error(err.stack));
    }

    private defineEvents(socket: SocketIO.Socket) {
    }
}

function initSocket(socket: SocketIO.Socket, io: SocketIO.Server, session: any, database: Database) {
    socket.on('logout', callbacks.tryFunc((guid: string) => {
        session.passport = null;
        session.save();
        socket.emit(guid);
    }));

    socket.on('ticket', callbacks.tryFunc((args: any, guid: string) => {
        getUser(session, database)
            .then(user => {
                if (user == null) {
                    return Promise.reject(new Error('user not found'));
                }
                return database.putTicket(user.id, args.title);
            })
            .then((ticket) => {
                if (args.isPost) {
                    // twitterにPostする☀
                }
            })
            .catch(err => console.error(err.stack))
            .then(() => {
                socket.emit(guid);
                return emitTickets(database, io);
            })
            .catch(err => console.error(err.stack));
    }));

    socket.on('delete ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
        if (!isString(ticketId))
            throw new Error('Type mismatch');
        getUser(session, database)
            .then(user => database.deleteTicket(user.id, ticketId))
            .then(() => socket.emit(guid))
            .then(() => emitTickets(database, io))
            .catch(err => console.error(err.stack));
    }));

    socket.on('progress ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
        if (!isString(ticketId))
            throw new Error('Type mismatch');
        getUser(session, database)
            .then(user => database.progressTicket(user.id, ticketId))
            .then(() => socket.emit(guid))
            .then(() => emitTickets(database, io))
            .catch(err => console.error(err.stack));
    }));

    socket.on('reverse ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
        if (!isString(ticketId))
            throw new Error('Type mismatch');
        getUser(session, database)
            .then(user => database.reverseTicket(user.id, ticketId))
            .then(() => socket.emit(guid))
            .then(() => emitTickets(database, io))
            .catch(err => console.error(err.stack));
    }));

    socket.on('complete ticket', callbacks.tryFunc((ticketId: string, url: string, guid: string) => {
        if (!isString(ticketId) || !isString(url))
            throw new Error('Type mismatch');
        getUser(session, database)
            .then(user => database.completeTicket(user.id, ticketId, url))
            .then(() => socket.emit(guid))
            .then(() => emitTickets(database, io))
            .catch(err => console.error(err.stack));
    }));

    return Promise.all([
        getUser(session, database)
            .then(user => socket.emit('user', user)),
        emitTickets(database, io)
    ]);
}

function emitTickets(database: Database, io: SocketIO.Server) {
    return Promise
        .all([
            database.tickets(dbs.TicketType.open),
            database.tickets(dbs.TicketType.inprogress),
            database.tickets(dbs.TicketType.close)
        ])
        .then(tickets => io.emit('tickets', {
            opens: tickets[0],
            inprogresses: tickets[1],
            closes: tickets[2]
        }));
}

function getUser(session: any, database: Database) {
    var passportUser = session.passport.user;
    if (passportUser == null) {
        return Promise.resolve<any>(null);
    } else {
        return database
            .getOrCreateUser(passportUser.provider, passportUser.providerId, passportUser.displayName)
            .then(users => ({
                id: users[0].get('id'),
                provider: passportUser.provider,
                providerId: passportUser.providerId,
                displayName: passportUser.displayName,
                photo: passportUser.photo
            }));
    }
}

function index(
    options: {
        router: express.IRouter<void>;
        io: SocketIO.Server;
        sessionStore: any;
        dataDir: string;
    }) {
    return Hayo.new(
        options.router,
        options.io,
        options.sessionStore,
        options.dataDir)
        .then(hayo => hayo.routes());
}

function isString(obj: any) {
    return typeof obj === 'string';
}

export = index;
