const express = require("express");
const {
  sendMessage,
  fetchMessages,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/", sendMessage);
router.get("/", fetchMessages);

router.post("/user-messages", fetchMessages);

module.exports = router;
