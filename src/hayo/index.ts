/// <reference path="../tsd.d.ts" />

import express = require('express');
import tickets = require('./resource/tickets');
import Sockets = require('./infrastructure/sockets');

function index(io: SocketIO.Server) {
    return {
        tickets: tickets(io),
    };
}

export = index;
