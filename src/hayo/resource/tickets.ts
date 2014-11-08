import express = require('express');
import Database = require('../infrastructure/database');

function tickets(io: SocketIO.Server, database: Database) {
    return {
        create(req: express.Request, res: express.Response) {
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
                    res.json(201);
                    return database.tickets()
                }).then(tickets => {
                    io.emit('tickets', tickets);
                })
                .catch(err => console.error(err.stack));
        }
    };
}

export = tickets;
