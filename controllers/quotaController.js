import { Error } from "sequelize";
import Quota from "../models/quotaModel.js";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

//GET QUOTA
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

//ADD QUOTA
export const addQuota = async (req, res) => {
  const t = await db.transaction();
  try {
    const { plus } = req.body;
    if (!plus) {
      throw makeError("Plus Field Cannot be Empty !", 400);
    }

    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    if (!quota) {
      quota = await Quota.create(
        {
          id: 1,
          quota: plus,
          total_quota: plus,
        },
        { transaction: t }
      );
    } else {
      const updatedQuota = (quota.quota ?? 0) + plus;
      const updatedTotal = (quota.total_quota ?? 0) + plus;

      await Quota.update(
        { quota: updatedQuota, total_quota: updatedTotal },
        { where: { id: 1 }, transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "Quota Updated",
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
