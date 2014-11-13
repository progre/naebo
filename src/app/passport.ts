import express = require('express');
import passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var secret = require('../secret.json');

var BASE_URL = 'http://apps.prgrssv.net';

export function init() {
    passport.serializeUser(function (user: any, done: Function) {
        done(null, user);
    });

    passport.deserializeUser(function (obj: any, done: Function) {
        done(null, obj);
    });

    passport.use(new TwitterStrategy(
        {
            consumerKey: secret.twitter.consumer_key,
            consumerSecret: secret.twitter.consumer_secret,
            callbackURL: BASE_URL + '/auth/twitter/callback'
        },
        (token: string, tokenSecret: string, profile: any, done: Function) => {
            done(null, {
                provider: profile.provider,
                providerId: profile.id,
                displayName: profile.displayName,
                photo: profile.photos[0].value,
                token: token,
                tokenSecret: tokenSecret
            });
        }));
}

export function use(app: express.Express) {
    app.use(passport.initialize());
    app.use(passport.session());
}

export function routes(app: express.Express) {
    app.get('/auth/twitter/callback', (req, res, next) => {
        var session = (<any>req).session;
        session.auth = session.auth || {};
        if (session['oauth:twitter'] == null) {
            res.redirect('/');
            next();
            return;
        }
        passport.authenticate('twitter', {
            successRedirect: session.auth.callbackTo,
            failureRedirect: '/'
        })(req, res, next);
    });
    app.get('/auth/twitter/', (req, res, next) => {
        passport.authenticate('twitter')(req, res, next);
    });
}
