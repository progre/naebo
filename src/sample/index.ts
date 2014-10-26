import express = require('express');

export function use(app: any) {
    app.use(express.static(__dirname + '/public'));
    app.use((req: express.Request, res: express.Response)
        => res.sendfile(__dirname + '/public/index.html'));
}