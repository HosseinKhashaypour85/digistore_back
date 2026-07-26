const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");

const Discount = sequelize.define(
  "Discount",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    percent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100,
      },
    },
    user_per_use: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "discounts",
    timestamps: false,
  }
);

module.exports = Discount;
