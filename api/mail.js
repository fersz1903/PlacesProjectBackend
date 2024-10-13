const { createPasswordResetToken } = require("./jwt.js");
const { writeResetTokenUser } = require("./database.js");
require("dotenv").config();
const nodemailer = require("nodemailer");
const BASE_URL = process.env.BASE_URL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWD = process.env.SMTP_PASSWD;

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
    let transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWD,
      },
    });

    let mailHtml =
      '<p>Merhaba,</p><p>Bu e-postayı, Sector Scout üzerinde şifrenizi sıfırlama talebinize yanıt olarak size gönderiyoruz. Şifrenizi sıfırlamak için lütfen aşağıdaki butona tıklayın:</p><p style="text-align: left;"><a href="{{reset_link}}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Şifreyi Sıfırla</a></p><p>Bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p><p>Teşekkürler,</p><p>Sector Scout Ekibi</p>';

    const resetLink = BASE_URL + "resetPassword/" + token;

    mailHtml = mailHtml.replace("{{reset_link}}", resetLink);

    let mailOptions = {
      from: `"Sector Scout" ${SMTP_USERNAME}`,
      to: `${email}`,
      subject: "Şifre Sıfırlama - Sector Scout",
      html: mailHtml,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Hata oluştu: ", error);
        return error;
      }
      console.log("Mail başarıyla gönderildi: %s", info.messageId);
    });
    return true;
  } catch (error) {
    console.log("mail error:", error);
    return false;
  }
}

module.exports = { sendResetPasswordMail };
