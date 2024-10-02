const redisClient = require("./redisClient.js");

async function setTokenRedis(token, email) {
  const expirationTime = 3 * 24 * 60 * 60;
  await redisClient.setEx(`token:${email}`, expirationTime, token);
}

async function getTokenFromRedis(email) {
  const user = await redisClient.get(`token:${email}`);
  //console.log(user);
  return user;
}

module.exports = { setTokenRedis, getTokenFromRedis };
