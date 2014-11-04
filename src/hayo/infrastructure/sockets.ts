import socketIO = require('socket.io');
import Database = require('./database');

class Sockets {
    constructor(private io: SocketIO.Server) {
        var database = new Database();
        database.initialize()
            .catch(e => {
                console.error(e);
            });
        io.on('connection', socket => {
            console.log('connected');
            database.tickets()
                .then(tickets => {
                    socket.emit('tickets', tickets);
                });
        });
    }
}

export = Sockets;
