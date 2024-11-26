const express = require("express");
const { saveForm } = require("../database");
const { formSaveLimiter } = require("../Middlewares/rateLimiter");
const router = express.Router();

router.post(
  "/save",
  /* formSaveLimiter ,*/ async (req, res) => {
    return await saveForm(req, res);
  }
);

module.exports = router;
