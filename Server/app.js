import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
// import Error from "./middleware/error.middleware.js";
// import { Server } from "socket.io";
import User from "./models/user.model.js";
// import Message from "./models/message.model.js";

connectDB();
dotenv.config();

const app = express();
app.use(express.json());
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

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

// app.use("/api/user", userRoutes);
// app.use("/api/chat", chatsRoutes);
// app.use("/api/message", messageRoutes);

// app.use(Error.notFound);
// app.use(Error.errorHandler);


// const io = new Server(server, {
//     pingTimeout: 60000,
//     cors: {
//         origin: ["http://localhost:5173", "http://localhost:5174"],
//     },
// });

// io.on("connection", (socket) => {
//     console.log("Connected to socket.io");
//     socket.on("setup", (userData) => {
//         socket.join(userData._id.toString());
//         socket.emit("connected");
//     });

//     socket.on("join chat", (room) => {
//         socket.join(room);
//     });

//     socket.on("new message", async(newMessageRecieved) => {
//         // fetch the full message from DB and populate sender + chat
//         const message = await Message.findById(newMessageRecieved._id)
//             .populate("sender", "name pic")
//             .populate("chat");

//         if (!message) return console.log("Message not found in DB");

//         // populate chat users too
//         const chat = await Chat.findById(message.chat._id).populate(
//             "users",
//             "-password"
//         );
//         if (!chat.users) return console.log("chat.users not defined");

//         // send populated message to all chat users except sender
//         chat.users.forEach((user) => {
//             if (user._id.toString() === message.sender._id.toString()) return;

//             io.to(user._id.toString()).emit("message recieved", message);
//         });
//     });
// });