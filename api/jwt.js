const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWTSECRET;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

function createSignInToken(_userid, _email, _role) {
  const token = jwt.sign(
    { userId: _userid, email: _email, role: _role },
    jwtSecret,
    {
      expiresIn: "1h",
    }
  );
  console.log(token);
  return token;
}

function validateToken(token, res) {
  // try {
  //   if (!token) {
  //     // No token
  //     return res.status(400).send(false);
  //   }
  //   const verified = jwt.verify(token, jwtSecret);
  //   if (verified) {
  //     // Access Granted
  //     return res.status(200).send(true);
  //   } else {
  //     // Access Denied
  //     return res.status(401).send(false);
  //   }
  // } catch (error) {
  //   // Access Denied
  //   return res.status(401).send(false);
  // }
  jwt.verify(token, jwtSecret, (err) => {
    if (err) {
      return res
        .status(403)
        .json({ result: false, data: "Failed to authenticate token" });
    }
    return res.status(200).json({ result: true, data: "Token confirmed" });
  });
}

function decodeToken(token) {
  return jwt.decode(token);
}

function createPasswordResetToken(_email) {
  const token = jwt.sign({ email: _email }, jwtSecret, {
    expiresIn: "10m",
  });
  console.log(token);
  return token;
}

function verifyResetToken(token) {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createSignInToken,
  validateToken,
  decodeToken,
  createPasswordResetToken,
  verifyResetToken,
};
