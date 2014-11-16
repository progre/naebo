import Sequelize = require('sequelize');
import rps = require('../domain/repos/reposes');

var SERIAL = {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    get: function () {
        return this.getDataValue('id').toString(10);
    }
};

class Database {
    static new(dataDir: string) {
        var sequelize = new Sequelize(null, null, null, {
            dialect: 'sqlite',
            storage: dataDir + 'database.sqlite'
        });
        var database = new Database(sequelize);
        return database.sequelize.sync()
            .then(() => database);
    }

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
            openUserId: Sequelize.STRING,
            progressUserId: Sequelize.STRING,
            progressAt: Sequelize.DATE,
            completedAt: Sequelize.DATE
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

    constructor(private sequelize: Sequelize) {
    }

    tickets(type: rps.TicketType) {
        return this.ticket
            .findAll({
                where: { type: type },
                order: [['ticket.id', 'DESC']]
            }).then(instances => instances.map(x => {
                return {
                    id: x['id'],
                    createdAt: x['createdAt'],
                    title: x['title'],
                    url: x['url'],
                    openUser: toUser(x['openUserId']),
                    progressUser: toUser(x['progressUserId'])
                };
            }));
    }

    putTicket(user: rps.User, title: string) {
        return this.ticket.create({
            title: title,
            type: rps.TicketType.open,
            openUserId: toUserId(user)
        });
    }

    deleteTicket(user: rps.User, ticketId: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId } },
                    { transaction: t })
                    .then(ticket => {
                        return ticket.destroy({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    progressTicket(user: rps.User, ticketId: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['type'] = rps.TicketType.inprogress;
                        ticket['progressUserId'] = toUserId(user);
                        ticket['progressAt'] = new Date();
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    reverseTicket(user: rps.User, ticketId: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId, progressUserId: toUserId(user) } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['type'] = rps.TicketType.open;
                        ticket['progressUserId'] = null;
                        ticket['progressAt'] = null;
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }

    completeTicket(user: rps.User, ticketId: string, url: string) {
        return this.sequelize.transaction({ autocommit: false })
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId, progressUserId: toUserId(user) } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['type'] = rps.TicketType.close;
                        ticket['url'] = url;
                        ticket['completedAt'] = new Date();
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
            });
    }
}

function toUser(userId: string) {
    if (userId == null)
        return null;
    var parts = userId.split('-');
    return {
        provider: parts[0],
        providerId: parts[1]
    };
}

function toUserId(user:rps.User) {
    return user.provider + '-' + user.providerId;
}

export = Database;
