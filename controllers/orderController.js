import { Error } from "sequelize";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Quota from "../models/quotaModel.js";
import QRCode from "qrcode";

// ADD ORDER
export const addOrder = async (req, res) => {
  try {
    const { nipp, nama } = req.body;
    if (!nipp || !nama || !Array.isArray(nama)) {
      const msg = !nipp
        ? "NIPP field cannot be empty!"
        : !nama
        ? "Nama field cannot be empty!"
        : "Nama must be an array!";
      const error = new Error(msg);
      error.statusCode = 401;
      throw error;
    }

    // KASIH IF ELSE VALIDASI
    const jumlahPeserta = nama.length;
    const user = await User.findOne({
      where: {
        nipp: nipp,
      },
    });

    if (!user) {
      const error = new Error("User tidak ditemukan!");
      error.statusCode = 404;
      throw error;
    }

    const currentPenetapan = user.penetapan;
    const quota = await Quota.findOne({ where: { id: 1 } });
    const currentQuota = quota.quota;

    if (currentPenetapan <= 0) {
      const error = new Error("Jatah Kamu Sudah Habis !");
      error.statusCode = 400;
      throw error;
    }

    if (currentPenetapan < jumlahPeserta) {
      const error = new Error(
        "Jatah Kamu Tidak Mencukupi. Jatah Tersisa " + currentPenetapan + " !"
      );
      error.statusCode = 400;
      throw error;
    }

    if (currentQuota < jumlahPeserta) {
      const error = new Error(
        "Quota Tidak Mencukupi. Quota Tersisa " + currentQuota + " !"
      );
      error.statusCode = 400;
      throw error;
    }

    if (currentQuota <= 0) {
      const error = new Error("Quota Sudah Habis !");
      error.statusCode = 400;
      throw error;
    }

    const existingOrder = await Order.findOne({ where: { nipp } });

    if (existingOrder) {
      const updatedNama = [...existingOrder.nama, ...nama];

      const qrData = JSON.stringify({ nipp, nama: updatedNama });
      const qrCode = await QRCode.toDataURL(qrData);

      await existingOrder.update({
        nama: updatedNama,
        qr: qrCode,
      });
    } else {
      const qrData = JSON.stringify({ nipp, nama });
      const qrCode = await QRCode.toDataURL(qrData);

      await Order.create({ nipp, nama, qr: qrCode });
    }

    const updatedPenetapan = currentPenetapan - jumlahPeserta;

    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp: nipp } }
    );

    const updatedQuota = currentQuota - jumlahPeserta;

    await Quota.update({ quota: updatedQuota }, { where: { id: 1 } });

    res.status(201).json({
      status: "Success",
      message: "Order Created",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// GET ORDERS
export const getOrder = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.status(200).json({
      status: "Success",
      message: "Orders Retrieved",
      data: orders,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const ifOrderExist = await Order.findOne({
      where: { nipp: req.params.nipp },
    });
    if (!ifOrderExist) {
      const error = new Error("Order not found !");
      error.statusCode = 404;
      throw error;
    }

    await Order.destroy({ where: { nipp: req.params.nipp } });
    res.status(200).json({
      status: "Success",
      message: "Order Deleted",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
