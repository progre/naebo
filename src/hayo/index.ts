/// <reference path="../../typings/tsd.d.ts" />
import tickets = require('./resource/tickets');
import socketIo = require('socket.io');

export = resources;
var resources = {
    tickets: tickets,
    'socket.io': (io: socketIo.Socket) => {
        io.on('connection', (socket: socketIo.Socket) => {
            console.log(io.set);
            //console.log(io.json);
            //console.log(io.log);
        });
    }
};