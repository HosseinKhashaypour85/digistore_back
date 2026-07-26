const { DataTypes } = require("sequelize");
const sequelize = require("../config/db/mysql");
const Product = require("./Product");

const CartItem = sequelize.define(
  "CartItem",
  {
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
  }
);

CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

module.exports = CartItem;
