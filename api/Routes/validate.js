const express = require("express");
const router = express.Router();
const { validateToken, verifyAdminRole } = require("../jwt");
const { checkCaptchaToken } = require("../gCaptcha");
require("dotenv").config();
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

// "url/validate/<>"

router.post("/validateToken", (req, res) => {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }
  return validateToken(token, res);
});

router.post("/validateAdmin", (req, res) => {
  const token = req.header(TOKEN_HEADER_KEY);

  if (!token) {
    return res.status(404).json({ result: false, data: "No token provided" });
  }
  return verifyAdminRole(token, res);
});

router.post("/validateCaptcha", async (req, res) => {
  return await checkCaptchaToken(req, res);
});

module.exports = router;
