import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // ambil dari cookie
    if (!refreshToken) return res.sendStatus(401); // Unauthorized

    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (!user) return res.sendStatus(403); // Forbidden

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);

        const { NIPP, NAMA } = user;
        const accessToken = jwt.sign(
          { NIPP, NAMA },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        res.json({
          accessToken,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
