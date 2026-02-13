const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    console.log(`Redis reconnect attempt #${times}`);
    return Math.min(times * 50, 2000); // wait up to 2s before retry
  },
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("reconnecting", () => console.log("Redis reconnecting"));
redis.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = redis;
