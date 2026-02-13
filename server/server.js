require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");

const initSocket = require("./src/sockets/chat.socket");
const authRoutes = require("./src/routes/auth.routes");
const messageRoutes = require("./src/routes/message.routes.js");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
});

initSocket(io);

server.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT),
);
