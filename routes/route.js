import express from "express";
import { refreshToken } from "../controllers/refreshToken.js";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getUser,
  getUserByNIPP,
  loginHandler,
  logout,
  addPenetapan,
} from "../controllers/userController.js";
import {
  addOrder,
  deleteOrder,
  getOrder,
  getOrderByNIPP,
  editOrder,
} from "../controllers/orderController.js";
import {
  getQuota,
  addQuota,
  subQuota,
} from "../controllers/quotaController.js";

const router = express.Router();
// REFRESH TOKEN
router.get("/token", refreshToken);

// AUTH
router.post("/login", loginHandler);
router.delete("/logout", logout);

// USERS
router.get("/users", verifyToken, getUser);
router.get("/users/:nipp", verifyToken, getUserByNIPP);
router.patch("/users/:nipp", verifyToken, addPenetapan);

// ORDER
router.post("/order", verifyToken, addOrder);
router.get("/order", verifyToken, getOrder);
router.get("/order/:nipp", verifyToken, getOrderByNIPP);
router.delete("/order/:nipp", verifyToken, deleteOrder);
router.put("/order/:nipp", verifyToken, editOrder);

// QUOTA
router.get("/quota", verifyToken, getQuota);
router.patch("/addquota", verifyToken, addQuota);
router.patch("/subquota", verifyToken, subQuota);

export default router;
