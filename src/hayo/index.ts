/// <reference path="../tsd.d.ts" />

import express = require('express');
import SessionStore = require('../app/sessionstore');
import tickets = require('./resource/tickets');
import Database = require('./infrastructure/database');

class Hayo {
    static create(app: express.IRouter<void>, io: SocketIO.Server, sessionStore: SessionStore) {
        return Database.create()
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
            // ‰¼“Še‚µ‚½‚à‚Ì‚ª‚ ‚ê‚ÎŠm’è‚·‚é
            res.redirect('../');
        });
        io.on('connect', tryFunc(socket => this.connect(socket)));
        //io.on('connect', socket => this.connect(socket));
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
                socket.on('logout', tryFunc((guid: string) => {
                    session.passport = null;
                    console.log('logout')
                    session.save();
                    socket.emit(guid);
                }));

                var user = session.passport.user;
                if (user == null) {
                    socket.emit('user', null);
                } else {
                    console.log(session.passport);
                    socket.emit('user', {
                        provider: user.provider,
                        providerId: user.providerId,
                        displayName: user.displayName,
                        photo: user.photo
                    });
                }
                return this.database.tickets();
            })
            .then(tickets => {
                socket.emit('tickets', tickets);
            })
            .catch(err => console.error(err.stack));
    }
}

function tryFunc(func: (arg: any) => void) {
    return (arg: any) => {
        try {
            func(arg);
        } catch (err) {
            console.error(err.stack);
        };
    };
}

function index(app: express.IRouter<void>, io: SocketIO.Server, sessionStore: any) {
    return Hayo.create(app, io, sessionStore)
        .then(hayo => hayo.routes());
}

export = index;
