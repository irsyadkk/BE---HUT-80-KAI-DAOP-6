import { Error } from "sequelize";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET USER
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

// GET USER BY NIPP
export const getUserByNIPP = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        nipp: req.params.nipp,
      },
    });
    if (!user) {
      throw makeError("User Not Found !", 404);
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

// UPDATE USER
export const updatePenetapan = async (req, res) => {
  try {
    const { penetapan } = req.body;
    const nipp = req.params.nipp;
    if (!penetapan) {
      throw makeError("Penetapan Field Cannot be Empty !", 400);
    }

    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
    });

    if (!ifUserExist) {
      throw makeError("User Not Found !", 404);
    }

    await User.update(
      { penetapan: penetapan },
      {
        where: { nipp: nipp },
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

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const nipp = req.params.nipp;
    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
    });
    if (!ifUserExist) {
      throw makeError("User Not Found !", 404);
    }

    await User.destroy({ where: { nipp: nipp } });
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
      throw makeError("User Not Found !", 404);
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
      secure: false, // kalau pakai HTTP
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
