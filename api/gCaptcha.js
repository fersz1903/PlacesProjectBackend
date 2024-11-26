require("dotenv").config();
const axios = require("axios");
const G_CAPTCHA_SECRET = process.env.G_CAPTCHA_SECRET;

async function checkCaptchaToken(CaptchaResponse) {
  try {
    //const { CaptchaResponse } = req.body;

    if (!CaptchaResponse) {
      return { success: false, code: 400, errors: "No captcha response!" };
    }

    const payload = {
      secret: G_CAPTCHA_SECRET,
      response: CaptchaResponse,
      action: "submit",
    };
    var verifyRes = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    //console.log("Captcha verify response: ", verifyRes.data);

    if (verifyRes.data.success) {
      if (verifyRes.data.score >= 0.5) {
        // return res.status(200).send({
        //   result: true,
        //   data: "Captcha confirmed",
        //   score: verifyRes.data.score,
        // });
        return { success: true, code: 200, errors: null };
      }
      // return res.status(403).send({
      //   result: false,
      //   data: "Captcha verification failed, possible bot",
      //   errors: verifyRes.data["error-codes"] || [],
      // });
      return {
        success: false,
        code: 403,
        errors: verifyRes.data["error-codes"] || [],
      };
    } else {
      // return res.status(400).send({
      //   result: false,
      //   data: "Captcha verification failed",
      //   errors: verifyRes.data["error-codes"] || [],
      // });
      // return {
      //   success: false,
      //   code: 500,
      //   errors: verifyRes.data["error-codes"] || [],
      // };
      throw new Error("Catpcha Error");
    }
  } catch (error) {
    console.log("Captcha Error: ", error);
    // return res.status(500).send({
    //   result: false,
    //   data: "Captcha Error",
    // });
    return {
      success: false,
      code: 500,
      errors: "Captcha Error",
    };
  }
}

module.exports = { checkCaptchaToken };
