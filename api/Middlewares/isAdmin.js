const { decodeToken } = require("../jwt.js");
require("dotenv").config();
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

function verifyAdmin(req, res, next) {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }

  const role = decodeToken(token).role;

  if (role != "admin") {
    return res
      .status(403)
      .json({ result: false, data: "Access Denied, Admin Privilege Required" });
  }
  next();
}

module.exports = verifyAdmin;
