const express = require("express");
const router = express.Router();
const {
  getUsers,
  registerUser,
  getUsersCount,
  updateUser,
  deleteUser,
  updateUserQuota,
} = require("../database.js");

// "url/admin/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba Admin, hoş geldinnn!" });
});

router.get("/getUsers", async (req, res) => {
  return await getUsers(req, res);
});

router.post("/registerUser", async (req, res) => {
  return await registerUser(req, res);
});

router.get("/getUsersCount", async (req, res) => {
  return await getUsersCount(req, res);
});

router.put("/updateUser", async (req, res) => {
  return await updateUser(req, res);
});

router.delete("/deleteUser", async (req, res) => {
  return await deleteUser(req, res);
});

router.put("/updateUserQuota", async (req, res) => {
  return await updateUserQuota(req, res);
});

module.exports = router;
