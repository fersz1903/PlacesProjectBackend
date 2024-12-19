const express = require("express");
const router = express.Router();
const {
  getUsers,
  registerUserByAdmin,
  getUsersCount,
  updateUser,
  deleteUser,
  updateUserQuota,
  updateUserSubscription,
  listAllForms,
  deleteForm,
  updateFormStatus,
  getForm,
  getFormsCount,
} = require("../database.js");

// "url/admin/<>"

router.get("/", (req, res) => {
  res.json({ message: "Merhaba Admin, hoş geldinnn!" });
});

router.get("/getUsers", async (req, res) => {
  return await getUsers(req, res);
});

router.post("/registerUser", async (req, res) => {
  return await registerUserByAdmin(req, res);
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

router.put("/updateUserSubscription", async (req, res) => {
  return await updateUserSubscription(req, res);
});

router.get("/getFormsCount", async (req, res) => {
  return await getFormsCount(req, res);
});

router.get("/getForms", async (req, res) => {
  return await listAllForms(req, res);
});

router.get("/getForm/:fid", async (req, res) => {
  return await getForm(req, res);
});

router.put("/updateForm", async (req, res) => {
  return await updateFormStatus(req, res);
});

router.delete("/deleteForm", async (req, res) => {
  return await deleteForm(req, res);
});

module.exports = router;
