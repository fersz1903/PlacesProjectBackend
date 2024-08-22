const express = require("express");
const router = express.Router();
const { sendResetPasswordMail } = require("../mail.js");
const { resetPassword } = require("../database.js");

// "url/user/<>"

router.post("/sendPasswordResetMail", async (req, res) => {
  return await sendResetPasswordMail(req, res);
});

router.post("/resetPassword", async (req, res) => {
  return await resetPassword(req, res);
});

module.exports = router;
