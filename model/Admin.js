const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");

const Admin = sequelize.define('admins-auth', {
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    password: {
        type: DataTypes.STRING,
    },
}, { tableName: 'admins-auth', id: false , timestamps : false});

console.log("Admin model rawAttributes:", JSON.stringify(Admin.rawAttributes));

module.exports = Admin;