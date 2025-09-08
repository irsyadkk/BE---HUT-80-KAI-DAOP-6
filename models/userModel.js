import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const User = db.define(
  "users",
  {
    nipp: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    nama: Sequelize.STRING,
    nipp_pekerja: Sequelize.INTEGER,
    pasangan: Sequelize.INTEGER,
    anak_kandung: Sequelize.INTEGER,
    anak_angkat: Sequelize.INTEGER,
    anak_tiri: Sequelize.INTEGER,
    jumlah_total: Sequelize.INTEGER,
    penetapan: Sequelize.INTEGER,
    refresh_token: Sequelize.TEXT,
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

db.sync().then(() => console.log("Database synced"));

export default User;
