import { Error } from "sequelize";
import Quota from "../models/quotaModel.js";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET QUOTA
export const getQuota = async (req, res) => {
  try {
    const quota = await Quota.findOne({ where: { id: 1 } });
    res.status(200).json({
      status: "Success",
      message: "Quota Retrieved",
      data: quota,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD QUOTA
export const addQuota = async (req, res) => {
  const t = await db.transaction();
  try {
    const { add } = req.body;
    if (!add) {
      throw makeError("Add Field Cannot be Empty !", 400);
    }

    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    const updatedQuota = quota.quota + add;
    const updatedTotal = quota.total_quota + add;
    if (!quota) {
      quota = await Quota.create(
        {
          id: 1,
          quota: add,
          total_quota: add,
        },
        { transaction: t }
      );
    } else {
      await Quota.update(
        { quota: updatedQuota, total_quota: updatedTotal },
        { where: { id: 1 }, transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Quota Added By ${add} ! Current Quota ${updatedQuota}`,
      data: { updatedQuota, updatedTotal },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// SUBTRACT QUOTA
export const subQuota = async (req, res) => {
  const t = await db.transaction();
  try {
    const { sub } = req.body;
    if (!sub) {
      throw makeError("Subtract Field Cannot be Empty !", 400);
    }

    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    if (!quota) {
      throw makeError("Quota Not Found !", 404);
    }

    if (sub > quota.quota) {
      throw makeError(
        `Quota Kurang dari ${sub} ! Quota Sekarang ${quota.quota}`
      );
    }

    const updatedQuota = quota.quota - sub;
    const updatedTotal = quota.total_quota - sub;

    await Quota.update(
      { quota: updatedQuota, total_quota: updatedTotal },
      { where: { id: 1 }, transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "Quota Subtracted",
      data: { updatedQuota, updatedTotal },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
