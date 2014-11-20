import express = require('express');
var session = require('express-session');
import cookieParser = require('cookie-parser');
import callbacks = require('../util/callbacks');
import Session = require('./session');

class SessionStore {
    store = new session.MemoryStore();

    use(app: express.Express) {
        app.use(cookieParser());
        app.use(session({
            store: this.store,
            secret: 'Miserable Fate',
            cookie: { httpOnly: false },
            resave: true,
            saveUninitialized: true
        }));
    }

    get(request: express.Request) {
        return new Promise<Session>((resolve, reject) => {
            var parseCookie = cookieParser('Miserable Fate');
            parseCookie(request, null, (err: any) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                var sid = request.signedCookies['connect.sid'];
                this.store.get(sid, callbacks.tryFunc((err: any, session: any) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    if (session == null) {
                        reject(new Error('session not found'));
                        return;
                    }
                    session.save = () => {
                        this.store.set(sid, session);
                    };
                    resolve(new Session(session));
                }));
            });
        });
    }
}

export = SessionStore;
