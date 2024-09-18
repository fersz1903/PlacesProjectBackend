const express = require("express");
const router = express.Router();
const {
  getUser,
  checkQuota,
  decraseQuota,
  changePassword,
} = require("../database.js");
const { downloadExcel } = require("../excel.js");
const {
  limiter,
  getUserLimiter,
  downloadLimiter,
  resetPasswordLimiter,
} = require("../Middlewares/rateLimiter.js");

// "url/home/<>"

router.get("/", limiter, (req, res) => {
  res.json({ message: "Merhaba, CustomerCompass API'ye hoş geldinnn!" });
});

router.get("/getUser", getUserLimiter, async (req, res) => {
  return await getUser(req, res);
});

router.post("/downloadExcel", downloadLimiter, (req, res) => {
  return downloadExcel(req, res);
});

// check quota if q>0 return yes
router.get("/checkQuota", async (req, res) => {
  //  TODO add quota limiter
  return await checkQuota(req, res);
});

router.put("/decreaseQuota", async (req, res) => {
  //  TODO add quota limiter
  return await decraseQuota(req, res);
});

router.put("/changePassword", resetPasswordLimiter, async (req, res) => {
  return await changePassword(req, res);
});

module.exports = router;
