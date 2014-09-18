import express = require('express');
import SubApplication = require('../subapplication');

export function use(app: SubApplication) {
    app.use(express.static(__dirname + '/public'));
    app.use((req: express.Request, res: express.Response)
        => res.sendfile(__dirname + '/public/index.html'));
}