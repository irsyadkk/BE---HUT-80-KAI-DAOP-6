import express from "express";
import cors from "cors";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split("|") || [];
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Not allowed origin -> " + origin));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.get("/", (req, res) => res.render("index"));
app.use(router);

app.listen(5000, () => console.log("Server connected"));
