/// <reference path="../tsd.d.ts" />

import express = require('express');
import callbacks = require('../util/callbacks');
import SessionStore = require('../app/sessionstore');
import Session = require('../app/session');
import Database = require('./infrastructure/database');
import rps = require('./domain/repos/reposes');
import Repos = require('./domain/repos/repos');

class Hayo {
    static new(
        app: express.IRouter<void>,
        io: SocketIO.Server,
        sessionStore: SessionStore,
        dataDir: string
        ) {
        return Repos.new(dataDir)
            .then(repos => new Hayo(app, io, sessionStore, repos));
    }

    constructor(
        private app: express.IRouter<void>,
        private io: SocketIO.Server,
        private sessionStore: SessionStore,
        private repos: Repos) {

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

    private connect(socket: SocketIO.Socket) {
        console.log('connected');
        this.sessionStore.get(socket.request)
            .then(session => {
                return this.initSocket(socket, session);
            })
            .catch(err => console.error(err.stack));
    }

    private initSocket(socket: SocketIO.Socket, session: Session) {
        socket.on('logout', callbacks.tryFunc((guid: string) => {
            session.logout();
            socket.emit(guid);
        }));

        socket.on('ticket', callbacks.tryFunc((args: any, guid: string) => {
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.putTicket(user, args.title)
                .then((ticket) => {
                    if (args.isPost) {
                        // twitterにPostする☀
                    }
                })
                .catch(err => console.error(err.stack))
                .then(() => {
                    socket.emit(guid);
                    return this.emitTickets();
                })
                .catch(err => console.error(err.stack));
        }));

        socket.on('delete ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
            if (!isString(ticketId))
                throw new Error('Type mismatch');
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.deleteTicket(user, ticketId)
                .then(() => socket.emit(guid))
                .then(() => this.emitTickets())
                .catch(err => console.error(err.stack));
        }));

        socket.on('like open ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
            if (!isString(ticketId))
                throw new Error('Type mismatch');
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.likeOpenTicket(user, ticketId)
                .then(() => socket.emit(guid))
                .then(() => this.emitTickets())
                .catch(err => console.error(err.stack) || console.trace());
        }));

        socket.on('progress ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
            if (!isString(ticketId))
                throw new Error('Type mismatch');
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.progressTicket(user, ticketId)
                .then(() => socket.emit(guid))
                .then(() => this.emitTickets())
                .catch(err => console.error(err.stack));
        }));

        socket.on('reverse ticket', callbacks.tryFunc((ticketId: string, guid: string) => {
            if (!isString(ticketId))
                throw new Error('Type mismatch');
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.reverseTicket(user, ticketId)
                .then(() => socket.emit(guid))
                .then(() => this.emitTickets())
                .catch(err => console.error(err.stack));
        }));

        socket.on('complete ticket', callbacks.tryFunc((ticketId: string, url: string, guid: string) => {
            if (!isString(ticketId) || !isString(url))
                throw new Error('Type mismatch');
            var user = session.user();
            if (user == null)
                throw new Error('user not found');
            this.repos.database.completeTicket(user, ticketId, url)
                .then(() => socket.emit(guid))
                .then(() => this.emitTickets())
                .catch(err => console.error(err.stack));
        }));

        return Promise.all([
            Promise.resolve(socket.emit('user', session.user())),
            this.emitTickets()
        ]);
    }

    private emitTickets() {
        return Promise
            .all([
                this.repos.tickets(rps.TicketType.open),
                this.repos.tickets(rps.TicketType.inprogress),
                this.repos.tickets(rps.TicketType.close)
            ])
            .then(tickets => this.io.emit('tickets', {
                opens: tickets[0],
                inprogresses: tickets[1],
                closes: tickets[2]
            }));
    }
}

function toArray<T>(obj: { [id: number]: T }) {
    var list: T[] = [];
    for (var key in obj) {
        list.push(obj[key]);
    }
    return list;
}

function isString(obj: any) {
    return typeof obj === 'string';
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
        .then(hayo => ({}));
}

export = index;
