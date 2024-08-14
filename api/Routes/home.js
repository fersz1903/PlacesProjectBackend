const express = require("express");
const router = express.Router();
const { getUser } = require("../database.js");

// "url/home/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba, CustomerCompass API'ye hoş geldinnn!" });
});

router.get("/getUser", (req, res) => {
  return getUser(req, res);
});

module.exports = router;
