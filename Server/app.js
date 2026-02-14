import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import connectDB from "./config/db.js";
import initSocket from "./config/socket.js";
import userRoutes from "./routes/user.route.js";
import discussionRoutes from "./routes/discussion.route.js";
import materialRoutes from "./routes/material.route.js";
import answerRoutes from "./routes/answer.route.js";
import unitRoutes from "./routes/unit.route.js";
import chatRoutes from "./routes/chat.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/user", userRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

const httpServer = createServer(app);
const io = initSocket(httpServer);

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
