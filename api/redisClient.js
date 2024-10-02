const redis = require("redis");

const redisClient = redis.createClient({
  // host: "redis",
  // port: 6379,
  url: "redis://redis:6379",
});

redisClient.connect();

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis error: ", err);
  redisClient.disconnect();
  return err;
});

module.exports = redisClient;
