const express = require("express");
const router = express.Router();
const { sendResetPasswordMail } = require("../mail.js");
const { resetPassword, verificateEmailToken } = require("../database.js");
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

router.post("/verificateEmail", resetPasswordLimiter, async (req, res) => {
  return await verificateEmailToken(req, res);
});

module.exports = router;
