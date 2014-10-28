import express = require('express');
import Database = require('../infrastructure/database');

var database = new Database();
database.initialize()
    .catch(e => {
        console.error(e);
    });

export function index(req: express.Request, res: express.Response) {
    database.tickets()
        .then(tickets => {
            console.log(JSON.stringify(tickets))
            res.json(tickets);
        });
}

export function create(req: express.Request, res: express.Response) {
    var json: any;
    try {
        json = JSON.parse((<Buffer>req.read()).toString());
    } catch (e) {
        res.send(400);
        return;
    }
    database.putTicket(json.title)
        .then(() => {
            if (json.isPost) {
                // twitterにPostする☀
            }
            return database.tickets();
        })
        .then(tickets => {
            res.json(201, tickets);
        });
}

export function update(req: express.Request, res: express.Response) {
    res.send(304);
}
