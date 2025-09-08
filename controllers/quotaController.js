import { Error } from "sequelize";
import Quota from "../models/quotaModel.js";

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
  try {
    const { plus } = req.body;
    if (!plus) {
      const msg = `${"Plus"} field cannot be empty !`;
      const error = new Error(msg);
      error.statusCode = 401;
      throw error;
    }
    const quota = await Quota.findOne({ where: { id: 1 } });
    if (!quota) {
      quota = await Quota.create({
        id: 1,
        quota: plus,
        total_quota: plus,
      });
    } else {
      const updatedQuota = (quota.quota ?? 0) + plus;
      const updatedTotal = (quota.total_quota ?? 0) + plus;

      await Quota.update(
        { quota: updatedQuota, total_quota: updatedTotal },
        { where: { id: 1 } }
      );
    }

    res.status(200).json({
      status: "Success",
      message: "Quota Updated",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
