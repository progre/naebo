import Sequelize = require('sequelize');
import dbs = require('./databases');

var SERIAL = {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    get: function () {
        return this.getDataValue('id').toString(10);
    }
};

class Database {
    static create() {
        var database = new Database();
        return database.sequelize.sync()
            .then(() => database);
    }

    private sequelize = new Sequelize(null, null, null, {
        dialect: 'sqlite',
        storage: 'database.sqlite'
    });

    private user = this.sequelize.define('User',
        {
            id: SERIAL,
            provider: Sequelize.STRING,
            providerId: Sequelize.STRING,
            name: Sequelize.STRING
        }, {
            updatedAt: false,
            paranoid: true
        });

    private ticket = this.sequelize.define('Ticket',
        {
            id: SERIAL,
            title: {
                type: Sequelize.STRING,
                validate: { len: [1, 32] }
            },
            type: Sequelize.INTEGER,
            url: {
                type: Sequelize.STRING,
                validate: { len: [1, 2083] }
            },
        }, {
            updatedAt: false,
            paranoid: true
        });

    //private like = this.sequelize.define('Like',
    //    {
    //        id: SERIAL,
    //        userId: Sequelize.INTEGER,
    //        ticketId: Sequelize.INTEGER
    //    }, {
    //        timestamps: false
    //    });

    constructor() {
        this.ticket.belongsTo(this.user, { as: 'openUser' });
        this.ticket.belongsTo(this.user, { as: 'progressUser' });
    }

    tickets(type: dbs.TicketType) {
        return this.ticket
            .findAll({
                include: [
                    { model: this.user, as: 'openUser' },
                    { model: this.user, as: 'progressUser' }
                ],
                where: { type: type },
                order: [['ticket.id', 'DESC']]
            }).then(instances => instances.map(x => {
                var openUser = x['openUser'];
                var progressUser = x['progressUser'];
                return {
                    id: x['id'],
                    createdAt: x['createdAt'],
                    title: x['title'],
                    url: x['url'],
                    openUser: openUser == null ? null : {
                        id: openUser.id,
                        name: openUser.name,
                        provider: openUser.provider,
                        providerId: openUser.providerId
                    },
                    progressUser: progressUser == null ? null : {
                        id: progressUser.id,
                        name: progressUser.name,
                        provider: progressUser.provider,
                        providerId: progressUser.providerId
                    }
                };
            }));
    }

    getOrCreateUser(provider: string, providerId: string, name: string) {
        return this.user.findOrCreate(
            {
                where: {
                    provider: provider,
                    providerId: providerId
                },
                defaults: {
                    provider: provider,
                    providerId: providerId,
                    name: name
                }
            });
    }

    putTicket(userId: string, title: string) {
        return this.ticket.create({
            title: title,
            type: dbs.TicketType.open,
            openUserId: userId
        });
    }

    deleteTicket(userId: string, ticketId: string) {
        console.log(userId, ticketId);
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId } },
                    { transaction: t })
                    .then(ticket => {
                        return ticket.destroy({ transaction: t });
//                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    progressTicket(userId: string, ticketId: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['progressUserId'] = userId;
                        ticket['type'] = dbs.TicketType.inprogress;
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    reverseTicket(userId: string, ticketId: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId, progressUserId: userId } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['progressUserId'] = null;
                        ticket['type'] = dbs.TicketType.open;
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    completeTicket(userId: string, ticketId: string, url: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId, progressUserId: userId } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['url'] = url;
                        ticket['type'] = dbs.TicketType.close;
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    private userBy(id: string) {
        return this.user.findOne({ attributes: ['id'], where: { id: id } });
    }
}

export = Database;
