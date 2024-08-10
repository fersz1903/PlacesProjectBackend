const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWTSECRET;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

function createSignInToken(_userid, _username) {
  const token = jwt.sign({ userId: _userid, username: _username }, jwtSecret, {
    expiresIn: "1h",
  });
  console.log(token);
  return token;
}

function validateToken(token) {
  try {
    if (!token) {
      return false;
    }
    const verified = jwt.verify(token, jwtSecret);
    if (verified) {
      return true;
    } else {
      // Access Denied
      return false;
    }
  } catch (error) {
    // Access Denied
    return false;
  }
}

module.exports = {
  createSignInToken,
  validateToken,
};
