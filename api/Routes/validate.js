const express = require("express");
const router = express.Router();
const { validateToken } = require("../jwt");
require("dotenv").config();
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

// "url/validate/<>"

router.post("/validateToken", async (req, res) => {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }
  return validateToken(token, res);
});

module.exports = router;
