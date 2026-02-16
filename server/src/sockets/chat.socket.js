const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");
const { saveMessage, expireUserChats } = require("../services/messageService");

let onlineUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    const user = await User.findById(userId);

    // 🔥 Broadcast to all users that a new user joined
    socket.broadcast.emit("userJoined", {
      _id: user._id,
      username: user.username,
    });

    // Send updated online users list
    io.emit("onlineUsers", [...onlineUsers.keys()]);

    // Typing
    socket.on("typing", ({ receiverId }) => {
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", {
          senderId: userId,
        });
      }
    });

    // Stop Typing
    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", {
          senderId: userId,
        });
      }
    });

    // Handle private messages
    socket.on("privateMessage", async ({ receiverId, content }) => {
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
      });

      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("privateMessage", message);
      }

      socket.emit("privateMessage", message);

      await saveMessage(message);
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      await expireUserChats(userId);
      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });
  });
};
