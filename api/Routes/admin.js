const express = require("express");
const router = express.Router();
const { getUsers, registerUser } = require("../database.js");

// "url/admin/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba Admin, hoş geldinnn!" });
});

router.get("/getUsers", (req, res) => {
  return getUsers(req, res);
});

router.post("/registerUser", (req, res) => {
  return registerUser(req, res);
});

module.exports = router;
