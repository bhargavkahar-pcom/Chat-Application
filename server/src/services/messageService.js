const Message = require("../models/Message");
const redis = require("../config/redis");

const CHAT_TTL = 24 * 60 * 60; // 24 hours in seconds

const saveMessage = async (message) => {
  const chatKey = `chat:${[message.sender, message.receiver].sort().join(":")}`;
  await redis.lpush(chatKey, JSON.stringify(message));
  await redis.ltrim(chatKey, 0, 99);
  await redis.expire(chatKey, CHAT_TTL); // set TTL so inactive chats expire

  return message;
};

const getMessages = async (sender, receiver, limit = 50) => {
  const chatKey = `chat:${[sender, receiver].sort().join(":")}`;
  let messages = await redis.lrange(chatKey, -limit, -1);

  if (messages.length === 0) {
    messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    if (messages.length > 0) {
      const pipeline = redis.pipeline();
      messages.forEach((msg) => pipeline.rpush(chatKey, JSON.stringify(msg)));
      pipeline.ltrim(chatKey, 0, 99);
      pipeline.expire(chatKey, CHAT_TTL);
      await pipeline.exec();
    }
  } else {
    messages = messages.map((msg) => JSON.parse(msg));
  }

  return messages;
};

const expireUserChats = async (userId, ttlSeconds = 1) => {
  try {
    let cursor = 0;
    let expiredCount = 0;

    do {
      // Scan Redis keys in batches
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        `chat:*${userId}*`,
        "COUNT",
        100,
      );

      cursor = Number(nextCursor);

      if (keys.length > 0) {
        // Use pipeline for efficiency
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.expire(key, ttlSeconds));
        const results = await pipeline.exec();

        // Count keys successfully expired
        expiredCount += results.filter(
          ([err, res]) => !err && res === 1,
        ).length;
      }
    } while (cursor !== 0);

    console.log(
      `All chat caches for user ${userId} set to expire. Total keys affected: ${expiredCount}`,
    );
  } catch (err) {
    console.error("Failed to expire chat caches for user:", err);
  }
};

module.exports = {
  saveMessage,
  getMessages,
  expireUserChats,
};
