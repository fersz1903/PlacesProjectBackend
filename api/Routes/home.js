const express = require("express");
const router = express.Router();
const { getUser } = require("../database.js");
const { downloadExcel } = require("../excel.js");

// "url/home/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba, CustomerCompass API'ye hoş geldinnn!" });
});

router.get("/getUser", (req, res) => {
  return getUser(req, res);
});

router.post("/downloadExcel", (req, res) => {
  return downloadExcel(req, res);
});

module.exports = router;
