import Sequelize = require('sequelize');
import rps = require('../domain/repos/reposes');
import Schema = require('./schema');

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

    private schema = new Schema(this.sequelize);

    constructor(private sequelize: Sequelize) {
    }

    tickets(type: rps.TicketType) {
        return this.schema.ticket
            .findAll({
                where: { type: type },
                order: [['ticket.id', 'DESC']],
                include: [this.schema.likeOpen, this.schema.likeInprogress]
            }).then(instances => instances.map(x => ({
                id: x['id'],
                createdAt: x['createdAt'],
                title: x['title'],
                url: x['url'],
                openUser: toUser(x['openUserId']),
                progressUser: toUser(x['progressUserId']),
                likeOpens: x['LikeOpens'].length,
                likeInprogresses: count(x['LikeInprogresses'])
            })));
    }

    putTicket(user: rps.User, title: string) {
        return this.schema.ticket.create({
            title: title,
            type: rps.TicketType.open,
            openUserId: toUserId(user)
        });
    }

    deleteTicket(user: rps.User, ticketId: string) {
        return this.transaction().then(t => {
            return this.schema.ticket.findOne(
                { where: { id: ticketId } },
                { transaction: t })
                .then(ticket => {
                    return ticket.destroy({ transaction: t });
                })
                .then(() => t.commit());
        });
    }

    likeOpenTicket(user: rps.User, ticketId: string) {
        return this.transaction().then(t => {
            return this.schema.ticket.findOne(
                {
                    where: { id: ticketId },
                    include: [this.schema.likeOpen]
                },
                { transaction: t })
                .then(ticket => {
                    return ticket['getLikeOpens'](
                        { where: { userId: toUserId(user) } },
                        { transaction: t })
                        .then((likeOpens: SequelizeJS.Instance[]) => {
                            if (likeOpens.length > 0)
                                return;
                            return ticket['createLikeOpen'](
                                { userId: toUserId(user) },
                                { transaction: t });
                        });
                })
                .then(() => t.commit());
        });
    }

    progressTicket(user: rps.User, ticketId: string) {
        return this.updateTicket(
            {
                id: ticketId
            },
            {
                type: rps.TicketType.inprogress,
                progressUserId: toUserId(user),
                progressAt: new Date()
            });
    }

    likeInprogressTicket(user: rps.User, ticketId: string) {
        return this.transaction().then(t => {
            return this.schema.ticket.findOne(
                {
                    where: { id: ticketId },
                    include: [this.schema.likeInprogress]
                },
                { transaction: t })
                .then(ticket => {
                    return ticket['getLikeInprogresses'](
                        { where: { userId: toUserId(user) } },
                        { transaction: t })
                        .then((likeInprogresses: SequelizeJS.Instance[]) => {
                            if (likeInprogresses.length > 0) {
                                var likeInprogress = likeInprogresses[0];
                                likeInprogress['count'] += 1;
                                return likeInprogress.save({ transaction: t });
                            }
                            return ticket['createLikeInprogress'](
                                {
                                    userId: toUserId(user),
                                    count: 1
                                },
                                { transaction: t });
                        });
                })
                .then(() => t.commit());
        });
    }

    reverseTicket(user: rps.User, ticketId: string) {
        return this.updateTicket(
            {
                id: ticketId,
                progressUserId: toUserId(user)
            },
            {
                type: rps.TicketType.open,
                progressUserId: null,
                progressAt: null
            });
    }

    completeTicket(user: rps.User, ticketId: string, url: string) {
        return this.updateTicket(
            {
                id: ticketId,
                progressUserId: toUserId(user)
            },
            {
                type: rps.TicketType.close,
                url: url,
                completedAt: new Date()
            });
    }

    reverseToInprogressTicket(user: rps.User, ticketId: string) {
        return this.updateTicket(
            {
                id: ticketId,
                progressUserId: toUserId(user)
            },
            {
                type: rps.TicketType.inprogress,
                completedAt: null
            });
    }

    private updateTicket(where: any, options: any) {
        return this.transaction().then(t => {
            return this.schema.ticket.findOne(
                { where: where },
                { transaction: t })
                .then(ticket => {
                    for (var key in options) {
                        ticket[key] = options[key];
                    }
                    return ticket.save({ transaction: t });
                })
                .then(() => t.commit());
        });
    }

    private transaction() {
        return this.sequelize.transaction({ autocommit: false });
    }
}

function count(list: { count: number }[]) {
    return list.reduce<number>((sum, current) => sum + current.count, 0);
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

function toUserId(user: rps.User) {
    return user.provider + '-' + user.providerId;
}

export = Database;
