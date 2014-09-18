import express = require('express');

export = SubApplication;
class SubApplication {
    constructor(private name: string, private app: express.Express) {
    }

    use(handler: express.RequestHandler): express.Application {
        return this.app.use('/' + this.name, handler);
    }
}
