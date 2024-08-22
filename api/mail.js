const { createPasswordResetToken } = require("./jwt.js");
const { writeResetTokenUser } = require("./database.js");
require("dotenv").config();
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const BASE_URL = process.env.BASE_URL;

async function sendResetPasswordMail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ result: false, data: "Email required" });
    }

    // create reset token
    const token = createPasswordResetToken(email);

    // write to db
    if (!(await writeResetTokenUser(email, token))) {
      return res.status(404).send({ result: false, data: "Token Set Failed" });
    }

    // send mail
    if (sendMail(email, token) == true)
      return res
        .status(200)
        .send({ result: true, data: "Reset password mail sent" });

    return res
      .status(401)
      .send({ result: false, data: "Reset password failed" });
  } catch (error) {
    console.log("mail error:", error);
    return res.status(500).send({
      result: false,
      data: "An error occured during the password reset!",
    });
  }
}

function sendMail(email, token) {
  try {
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender(
      process.env.MAILERSEND_SENDER,
      "Customer Compass App"
    );

    const recipients = [new Recipient(email)];

    let mailHtml =
      '<p>Merhaba,</p><p>Bu e-postayı, CustomerCompass üzerinde şifrenizi sıfırlama talebinize yanıt olarak size gönderiyoruz. Şifrenizi sıfırlamak için lütfen aşağıdaki butona tıklayın:</p><p style="text-align: left;"><a href="{{reset_link}}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Şifreyi Sıfırla</a></p><p>Bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p><p>Teşekkürler,</p><p>CustomerCompass Ekibi</p>';

    const resetLink = BASE_URL + "resetPassword/" + token;

    mailHtml = mailHtml.replace("{{reset_link}}", resetLink);

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("Şifrenizi Sıfırlayın - CustomerCompass")
      .setHtml(mailHtml);

    mailerSend.email.send(emailParams);
    return true;
  } catch (error) {
    return error;
  }
}

module.exports = { sendResetPasswordMail };
