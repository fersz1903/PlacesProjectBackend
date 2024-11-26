const redisClient = require("./redisClient.js");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWTSECRET;

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
  const tokenId = uuid.v4(); // tokenId

  await redisClient.set(`token:${tokenId}`, token, "EX", expirationTime);

  await redisClient.lpush(`tokens:${email}`, tokenId);

  const userSubPlan = jwt.decode(token).subPlan || null;

  const MAX_TOKENS_PER_USER = userSubPlan === "Premium" ? 2 : 1;

  await redisClient.ltrim(`tokens:${email}`, 0, MAX_TOKENS_PER_USER - 1);

  console.log(
    `Token set in Redis for email: ${email}, tokenId: ${tokenId}, with expiration time: ${expirationTime} seconds`
  );
  const tokenIds = await redisClient.lrange(
    `tokens:${email}`,
    MAX_TOKENS_PER_USER,
    -1
  );
  if (tokenIds.length > 0) {
    for (const oldTokenId of tokenIds) {
      await redisClient.del(`token:${oldTokenId}`); // Eski token verisini sil
    }
  }
}

// async function getTokenFromRedis(email) {
//   const user = await redisClient.get(`token:${email}`);
//   return user;
// }

async function getTokenFromRedis(email, token) {
  const tokenIds = await redisClient.lrange(`tokens:${email}`, 0, -1);

  if (!tokenIds || tokenIds.length === 0) {
    console.log("No tokens found for the given email");
    return null;
  }

  for (const tokenId of tokenIds) {
    const storedToken = await redisClient.get(`token:${tokenId}`);
    if (storedToken === token) {
      console.log("Token is valid");
      return storedToken;
    }
  }
  console.log("Token is invalid");
  return null;
}

module.exports = { setTokenRedis, getTokenFromRedis };
