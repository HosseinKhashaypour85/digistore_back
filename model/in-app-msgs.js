const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");

const Messages = sequelize.define(
    "app-msgs",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        timestamps: false,
    });

module.exports = Messages;