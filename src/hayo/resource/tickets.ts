import express = require('express');

var db: any[] = [];
// http://apps.prgrssv.net/hayo/api/1/tickets/
/** ˆê—— */
export function index(req: express.Request, res: express.Response) {
    res.json(db);
}

export function create(req: express.Request, res: express.Response) {
    var json: any;
    try {
        json = JSON.parse((<Buffer>req.read()).toString());
    } catch (e) {
        res.send(400);
        return;
    }
    db.unshift({
        id: Date.now(),
        title: json.title,
        username: '@progremaster',
        likes: 0,
        createdAt: new Date(),
        deletedAt: null
    });
    if (json.isPost) {
        // twitter‚ÉPost‚·‚é
    }
    res.json(201, db.map(x => ({
        id: x.id,
        title: x.title,
        username: x.username,
        likes: x.likes,
        createdAt: x.createdAt.getTime(),
        deletedAt: x.deletedat == null ? null : x.deletedat.getTime()
    })));
}

export function update(req: express.Request, res: express.Response) {
    res.send(304);
}
