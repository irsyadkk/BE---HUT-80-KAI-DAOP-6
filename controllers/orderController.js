import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Quota from "../models/quotaModel.js";
import QRCode from "qrcode";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD ORDER
export const addOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama } = req.body;

    // INPUT VALIDATION
    if (
      !nipp ||
      !nama ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nipp
        ? "NIPP field cannot be empty !"
        : !nama
        ? "Nama field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const jumlahPeserta = nama.length;

    // USER CHECK
    const user = await User.findOne({
      where: {
        nipp: nipp,
      },
      transaction: t,
    });
    if (!user) {
      throw makeError("User Tidak Ditemukan !", 404);
    }

    const currentPenetapan = user.penetapan;

    // QUOTA CHECK
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    const currentQuota = quota.quota;

    // VALIDATION
    if (currentPenetapan <= 0) {
      throw makeError("Jatah Kamu Sudah Habis !", 400);
    }

    if (currentPenetapan < jumlahPeserta) {
      throw makeError(
        `Jatah Kamu Tidak Mencukupi. Jatah Tersisa ${currentPenetapan} !`,
        400
      );
    }

    if (currentQuota <= 0) {
      throw makeError("Quota Sudah Habis !", 400);
    }

    if (currentQuota < jumlahPeserta) {
      throw makeError(
        `Quota Tidak Mencukupi. Quota Tersisa ${currentQuota} !`,
        400
      );
    }

    // CHECK IF ORDER EXIST
    const existingOrder = await Order.findOne({
      where: { nipp },
      transaction: t,
    });

    // IF EXIST
    if (existingOrder) {
      const updatedNama = [...existingOrder.nama, ...nama];
      const qrData = JSON.stringify({ nipp, nama: updatedNama });
      const qrCode = await QRCode.toDataURL(qrData);

      await existingOrder.update(
        {
          nama: updatedNama,
          qr: qrCode,
        },
        { transaction: t }
      );
    }
    // IF DOESN'T
    else {
      const qrData = JSON.stringify({ nipp, nama });
      const qrCode = await QRCode.toDataURL(qrData);

      await Order.create({ nipp, nama, qr: qrCode }, { transaction: t });
    }

    // SUBTRACT PENETAPAN/JATAH
    const updatedPenetapan = currentPenetapan - jumlahPeserta;
    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp: nipp }, transaction: t }
    );

    // SUBTRACT QUOTA
    const updatedQuota = currentQuota - jumlahPeserta;
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    // COMMIT IF SUCCEED
    await t.commit();
    res.status(201).json({
      status: "Success",
      message: "Order Created",
      data: {
        nipp,
        nama,
        updatedPenetapan,
        updatedQuota,
      },
    });
  } catch (error) {
    // ROLLBACK IF FAILED
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
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

// GET ORDER BY NIPP
export const getOrderByNIPP = async (req, res) => {
  try {
    const nipp = req.params.nipp;
    const order = await Order.findOne({ where: { nipp: nipp } });
    if (!order) {
      throw makeError("Order Not Found !", 404);
    }

    res.status(200).json({
      status: "Success",
      message: "Order Retrieved",
      data: order,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// EDIT ORDER (REPLACE / REMOVE / ADD NAMA) + SESUAIKAN PENETAPAN & QUOTA
export const editOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const { nama } = req.body;

    // VALIDASI INPUT
    if (
      !nama ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nama
        ? "Nama field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const order = await Order.findOne({ where: { nipp }, transaction: t });
    if (!order) {
      throw makeError("Order Not Found !", 404);
    }

    const oldCount = order.nama.length;
    const newCount = nama.length;
    const diff = newCount - oldCount;

    const user = await User.findOne({ where: { nipp }, transaction: t });
    if (!user) {
      throw makeError("User Not Found !", 404);
    }

    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    if (!quota) {
      throw makeError("Quota Not Found !", 404);
    }

    // VALIDASI PENAMBAHAN
    if (diff > 0) {
      if (user.penetapan < diff) {
        throw makeError(
          `Jatah Kamu Tidak Mencukupi. Tersisa ${user.penetapan}`,
          400
        );
      }
      if (quota.quota < diff) {
        throw makeError(`Quota Tidak Mencukupi. Tersisa ${quota.quota}`, 400);
      }
    }

    // UPDATE PENETAPAN & QUOTA
    let updatedPenetapan = user.penetapan;
    let updatedQuota = quota.quota;

    if (diff > 0) {
      updatedPenetapan -= diff;
      updatedQuota -= diff;
    } else if (diff < 0) {
      updatedPenetapan += Math.abs(diff);
      updatedQuota += Math.abs(diff);
    }

    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );

    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    // UPDATE ORDER
    const qrData = JSON.stringify({ nipp, nama });
    const qrCode = await QRCode.toDataURL(qrData);

    await order.update({ nama, qr: qrCode }, { transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Order ${nipp} Updated`,
      data: { nipp, nama, updatedPenetapan, updatedQuota },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    // CHECK IF ORDER EXIST
    const nipp = req.params.nipp;
    const ifOrderExist = await Order.findOne({
      where: { nipp: nipp },
      transaction: t,
    });
    if (!ifOrderExist) {
      throw makeError("Order not found !", 404);
    }

    // GET JUMLAHPESERTA
    const jumlahPeserta = ifOrderExist.nama.length;

    // GET USER FROM USERS
    const user = await User.findOne({ where: { nipp: nipp }, transaction: t });
    if (!user) {
      throw makeError("User Not Found !", 404);
    }

    // ADD USER PENETAPAN/JATAH
    const updatedPenetapan = user.penetapan + jumlahPeserta;
    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );

    // ADD QUOTA
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    const updatedQuota = quota.quota + jumlahPeserta;
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    // DELETE ORDER
    await Order.destroy({ where: { nipp: nipp }, transaction: t });

    // COMMIT IF SUCCEED
    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "Order Deleted",
      data: { nipp, updatedPenetapan, updatedQuota },
    });
  } catch (error) {
    // ROLLBACK IF FAILED
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
