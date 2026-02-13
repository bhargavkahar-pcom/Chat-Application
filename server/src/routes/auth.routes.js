const router = require("express").Router();
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Message = require("../models/Message");

router.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ msg: "Username required" });

  let user = await User.findOne({ username });

  if (!user) user = await User.create({ username });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, user });
});

router.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.post("/user-messages", async (req, res) => {
  const { sender, receiver } = req.body;

  const messages = await Message.find({
    $or: [
      { sender, receiver },
      {
        sender: receiver,
        receiver: sender,
      },
    ],
  }).sort({ updatedAt: -1 });
  res.json(messages);
});

module.exports = router;
