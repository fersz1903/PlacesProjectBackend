const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWTSECRET;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

function verifyToken(req, res, next) {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }

  jwt.verify(token, jwtSecret, (err) => {
    if (err) {
      return res
        .status(403)
        .json({ result: false, data: "Failed to authenticate token" });
    }
    next();
  });
}

module.exports = verifyToken;
