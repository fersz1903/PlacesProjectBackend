const express = require("express");
const router = express.Router();
const { sendResetPasswordMail } = require("../mail.js");
const { resetPassword } = require("../database.js");
const {
  resetPasswordLimiter,
  sendMailLimiter,
} = require("../Middlewares/rateLimiter.js");

// "url/user/<>"

router.post("/sendPasswordResetMail", sendMailLimiter, async (req, res) => {
  return await sendResetPasswordMail(req, res);
});

router.post("/resetPassword", resetPasswordLimiter, async (req, res) => {
  return await resetPassword(req, res);
});

module.exports = router;
