import Sequelize = require('sequelize');

var SERIAL = {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
};

class Database {
    private sequelize = new Sequelize(null, null, null, {
        dialect: 'sqlite',
        storage: 'database.sqlite'
    });

    private user = this.sequelize.define('User',
        {
            id: SERIAL,
            provider: Sequelize.STRING,
            providerId: Sequelize.INTEGER,
            name: Sequelize.STRING
        }, {
            updatedAt: false,
            paranoid: true
        });

    private ticket = this.sequelize.define('Ticket',
        {
            id: SERIAL,
            userId: Sequelize.INTEGER,
            title: Sequelize.STRING
        }, {
            updatedAt: false,
            paranoid: true
        });

    private like = this.sequelize.define('Like',
        {
            id: SERIAL,
            userId: Sequelize.INTEGER,
            ticketId: Sequelize.INTEGER
        }, {
            timestamps: false
        });

    initialize(): Promise<{}> {
        return this.sequelize
            .sync({ force: true });
        //return this.sequelize
        //    .getMigrator({
        //        path: process.cwd() + '/migrations'
        //    })
        //    .migrate({ method: 'up' });
    }

    tickets() {
        return this.ticket.findAll({
            order: [['id', 'DESC']]
        });
    }

    putTicket(title: string) {
        return this.ticket.create({ title: title });
    }
}

export = Database;