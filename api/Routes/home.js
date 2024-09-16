const express = require("express");
const router = express.Router();
const { getUser, checkQuota, decraseQuota } = require("../database.js");
const { downloadExcel } = require("../excel.js");

// "url/home/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba, CustomerCompass API'ye hoş geldinnn!" });
});

router.get("/getUser", async (req, res) => {
  return await getUser(req, res);
});

router.post("/downloadExcel", (req, res) => {
  return downloadExcel(req, res);
});

// check quota if q>0 return yes
router.get("/checkQuota", async (req, res) => {
  return await checkQuota(req, res);
});

router.post("/decreaseQuota", async (req, res) => {
  return await decraseQuota(req, res);
});

module.exports = router;
