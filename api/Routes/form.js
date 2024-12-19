const express = require("express");
const { saveForm } = require("../database");
const { formSaveLimiter } = require("../Middlewares/rateLimiter");
const { upload } = require("../Middlewares/uploadImage");
const router = express.Router();

router.post(
  "/save",
  formSaveLimiter,
  upload.single("file"),
  async (req, res) => {
    return await saveForm(req, res);
  }
);

module.exports = router;
