import { Error } from "sequelize";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

//GET USER
export const getUser = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({
      status: "Success",
      message: "Users Retrieved",
      data: users,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

//GET USER BY NIPP
export const getUserByNIPP = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        nipp: req.params.nipp,
      },
    });
    if (!user) {
      const error = new Error("User tidak ditemukan !");
      error.statusCode = 400;
      throw error;
    }
    res.status(200).json({
      status: "Success",
      message: "User Retrieved",
      data: user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

//UPDATE USER
export const updatePenetapan = async (req, res) => {
  try {
    const { penetapan } = req.body;
    const ifUserExist = await User.findOne({
      where: { nipp: req.params.nipp },
    });
    if (!penetapan) {
      const msg = `${"Penetapan"} field cannot be empty !`;
      const error = new Error(msg);
      error.statusCode = 401;
      throw error;
    }
    if (!ifUserExist) {
      const error = new Error("User not found !");
      error.statusCode = 400;
      throw error;
    }

    await User.update(
      { penetapan: penetapan },
      {
        where: { nipp: req.params.nipp },
      }
    );

    res.status(200).json({
      status: "Success",
      message: "User Updated",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

//DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const ifUserExist = await User.findOne({
      where: { nipp: req.params.nipp },
    });
    if (!ifUserExist) {
      const error = new Error("User not found !");
      error.statusCode = 404;
      throw error;
    }

    await User.destroy({ where: { nipp: req.params.nipp } });
    res.status(200).json({
      status: "Success",
      message: "User Deleted",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// LOGIN HANDLER
export async function loginHandler(req, res) {
  try {
    const { nipp } = req.body;

    const user = await User.findOne({ where: { nipp } });

    if (!user) {
      return res.status(400).json({
        status: "Failed",
        message: "User tidak ditemukan",
      });
    }

    const userPlain = user.toJSON();
    const { refresh_token: __, ...safeUserData } = userPlain;

    const accessToken = jwt.sign(
      safeUserData,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await User.update(
      { refresh_token: refreshToken },
      { where: { nipp: user.nipp } }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: false, // kalau pakai HTTPS
    });

    res.status(200).json({
      status: "Success",
      message: "Login Berhasil",
      user: safeUserData,
      accessToken,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// LOGOUT
export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await User.findOne({
    where: {
      refresh_token: refreshToken,
    },
  });
  if (!user.refresh_token) return res.sendStatus(204);
  const userNIPP = user.nipp;
  await User.update(
    { refresh_token: null },
    {
      where: {
        nipp: userNIPP,
      },
    }
  );
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
}
