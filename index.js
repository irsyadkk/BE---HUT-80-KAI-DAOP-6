import express from "express";
import cors from "cors";
import router from "./routes/route.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.listen(5000, () => console.log("Server connected"));
