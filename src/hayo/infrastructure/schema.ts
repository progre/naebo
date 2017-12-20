import Sequelize = require('sequelize');

var SERIAL = {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    get: function () {
        return this.getDataValue('id').toString(10);
    }
};

class Schema {
    ticket = this.sequelize.define('Ticket',
        {
            id: SERIAL,
            title: {
                type: Sequelize.STRING,
                validate: { len: [1, 64] }
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

    likeOpen = this.sequelize.define('LikeOpen',
        {
            id: SERIAL,
            userId: Sequelize.STRING
        }, {
            timestamps: false
        });

    likeInprogress = this.sequelize.define('LikeInprogress',
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
}

export = Schema;
