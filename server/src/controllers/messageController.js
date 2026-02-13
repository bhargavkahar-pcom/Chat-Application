const { saveMessage, getMessages } = require("../services/messageService.js");

// Send a new message
const sendMessage = async (req, res) => {
  const { sender, receiver, text } = req.body;

  // Basic validation
  if (!sender || !receiver || !text) {
    return res
      .status(400)
      .json({ error: "Sender, receiver, and text are required." });
  }

  try {
    const message = await saveMessage(sender, receiver, text);
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
};

// Fetch messages between two users
const fetchMessages = async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ error: "Sender and receiver are required." });
  }

  try {
    const messages = await getMessages(sender, receiver);
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

module.exports = {
  sendMessage,
  fetchMessages,
};
