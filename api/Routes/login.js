const express = require("express");
const router = express.Router();
const { addData, registerUser, getUserToken } = require("../database.js");

// "url/login/<>"

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res
        .status(400)
        .json({ result: false, data: "Email and password required" });
    }
    //create token
    const response = await getUserToken(email, password, res);

    return response;
  } catch (error) {
    res.status(500).send({ result: false, data: "Sign In Server Error!" });
  }
});

module.exports = router;
