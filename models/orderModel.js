import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./userModel.js";

const Order = db.define(
  "orders",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },

    nipp: {
      type: Sequelize.STRING,
      allowNull: false,
      references: { model: User, key: "nipp" },
    },
    nama: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    qr: {
      type: Sequelize.BLOB,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database synced"));

export default Order;
