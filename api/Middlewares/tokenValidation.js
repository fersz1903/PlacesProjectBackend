const jwt = require("jsonwebtoken");
const { getTokenFromRedis } = require("../cache");
require("dotenv").config();
const jwtSecret = process.env.JWTSECRET;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

async function verifyToken(req, res, next) {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }

  jwt.verify(token, jwtSecret, async (err) => {
    if (err) {
      return res
        .status(403)
        .json({ result: false, data: "Failed to authenticate token" });
    }
    try {
      const tokenFromRedis = await getTokenFromRedis(jwt.decode(token).email);

      if (tokenFromRedis == null) {
        return res
          .status(403)
          .json({ result: false, data: "Failed to read token from redis" });
      }
      if (tokenFromRedis != token) {
        return res
          .status(403)
          .json({ result: false, data: "Logged in from another device" });
      }
    } catch (error) {
      console.log("redis jwt error: ", error);
      return res
        .status(403)
        .json({ result: false, data: "Failed to authenticate token" });
    }

    next();
  });
}

module.exports = verifyToken;
