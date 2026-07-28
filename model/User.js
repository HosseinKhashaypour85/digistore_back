const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");

const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    nation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    profile: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    subscription: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

module.exports = User;