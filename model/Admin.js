const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");

const Admin = sequelize.define('admins-auth', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
    },
}, { tableName: 'admins-auth', timestamps: false , createdAt : false , });

console.log("Admin model rawAttributes:", JSON.stringify(Admin.rawAttributes));

module.exports = Admin;