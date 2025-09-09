import express from "express";
import { refreshToken } from "../controllers/refreshToken.js";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getUser,
  getUserByNIPP,
  updatePenetapan,
  loginHandler,
  logout,
} from "../controllers/userController.js";
import {
  addOrder,
  deleteOrder,
  getOrder,
  getOrderByNIPP,
} from "../controllers/orderController.js";
import { getQuota, addQuota } from "../controllers/quotaController.js";

const router = express.Router();
// REFRESH TOKEN
router.get("/token", refreshToken);

// AUTH
router.post("/login", loginHandler);
router.delete("/logout", logout);

// USERS
router.get("/users", verifyToken, getUser);
router.get("/users/:nipp", verifyToken, getUserByNIPP);
// PATCH INI HARUS VALIADASI LAGI ? GIMANA KALO DIA UDAH ORDER TAPI PENETAPAN DIKURANGIN ?
router.patch("/users/:nipp", verifyToken, updatePenetapan);

// ORDER
router.post("/order", verifyToken, addOrder);
router.get("/order", verifyToken, getOrder);
router.get("/order/:nipp", verifyToken, getOrderByNIPP);
router.delete("/order/:nipp", verifyToken, deleteOrder);

// QUOTA
router.get("/quota", verifyToken, getQuota);
router.patch("/quota", verifyToken, addQuota);

export default router;
