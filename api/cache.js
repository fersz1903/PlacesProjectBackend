const redisClient = require("./redisClient.js");

// async function setTokenRedis(token, email) {
//   const expirationTime = 3 * 24 * 60 * 60;
//   await redisClient.setEx(`token:${email}`, expirationTime, token);
// }

// async function getTokenFromRedis(email) {
//   const user = await redisClient.get(`token:${email}`);
//   //console.log(user);
//   return user;
// }

async function setTokenRedis(token, email) {
  const expirationTime = 3 * 24 * 60 * 60; // 3 gün (saniye cinsinden)
  await redisClient.set(`token:${email}`, token, "EX", expirationTime);
  console.log(
    `Token set in Redis for email: ${email} with expiration time: ${expirationTime} seconds`
  );
}

async function getTokenFromRedis(email) {
  const user = await redisClient.get(`token:${email}`);
  return user;
}

module.exports = { setTokenRedis, getTokenFromRedis };
