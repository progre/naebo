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

    private likeOpen = this.sequelize.define('LikeOpen',
        {
            id: SERIAL,
            userId: Sequelize.STRING
        }, {
            timestamps: false
        });

    private likeInprogress = this.sequelize.define('LikeInprogress',
        {
            id: SERIAL,
            userId: Sequelize.STRING,
            count: Sequelize.INTEGER
        }, {
            timestamps: false
        });

    constructor(private sequelize: Sequelize) {
        this.ticket.hasMany(this.likeOpen);
        this.likeOpen.belongsTo(this.ticket);
        this.ticket.hasMany(this.likeInprogress);
        this.likeInprogress.belongsTo(this.ticket);
    }

    tickets(type: rps.TicketType) {
        return this.ticket
            .findAll({
                where: { type: type },
                order: [['ticket.id', 'DESC']],
                include: [this.likeOpen, this.likeInprogress]
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
        return this.ticket.create({
            title: title,
            type: rps.TicketType.open,
            openUserId: toUserId(user)
        });
    }

    deleteTicket(user: rps.User, ticketId: string) {
        return this.transaction()
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

    likeOpenTicket(user: rps.User, ticketId: string) {
        return this.transaction().then(t => this.ticket.findOne(
            {
                where: { id: ticketId },
                include: [this.likeOpen]
            },
            { transaction: t })
            .then(ticket => ticket['getLikeOpens'](
                { where: { userId: toUserId(user) } },
                { transaction: t })
                .then((likeOpens: SequelizeJS.Instance[]) => {
                    if (likeOpens.length > 0)
                        return;
                    return ticket['createLikeOpen'](
                        { userId: toUserId(user) },
                        { transaction: t });
                }))
            .then(() => t.commit()));
    }

    progressTicket(user: rps.User, ticketId: string) {
        return this.transaction()
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

    likeInprogressTicket(user: rps.User, ticketId: string) {
        return this.transaction().then(t => this.ticket.findOne(
            {
                where: { id: ticketId },
                include: [this.likeInprogress]
            },
            { transaction: t })
            .then(ticket => ticket['getLikeInprogresses'](
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
                }))
            .then(() => t.commit()));
    }

    reverseTicket(user: rps.User, ticketId: string) {
        return this.transaction()
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
        return this.transaction()
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

    reverseToInprogressTicket(user: rps.User, ticketId: string) {
        return this.transaction()
            .then(t => {
                return this.ticket.findOne(
                    { where: { id: ticketId, progressUserId: toUserId(user) } },
                    { transaction: t })
                    .then(ticket => {
                        ticket['type'] = rps.TicketType.inprogress;
                        ticket['completedAt'] = null;
                        return ticket.save({ transaction: t });
                    })
                    .then(() => {
                        t.commit();
                    });
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
