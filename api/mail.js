const { createPasswordResetToken } = require("./jwt.js");
const {
  writeResetTokenUser,
  getSubsEndsUsers,
  updateUserSubsNotified,
} = require("./database.js");
require("dotenv").config();
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const BASE_URL = process.env.BASE_URL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWD = process.env.SMTP_PASSWD;
const SMTP_SENDER = process.env.SMTP_SENDER;

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
    // let transporter = nodemailer.createTransport({
    //   host: SMTP_HOST,
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: SMTP_USERNAME,
    //     pass: SMTP_PASSWD,
    //   },
    // });

    let transporter = nodemailer.createTransport({
      service: "gmail", // Google SMTP
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWD,
      },
    });

    // let mailHtml =
    //   '<p>Merhaba,</p><p>Bu e-postayı, Sector Scout üzerinde şifrenizi sıfırlama talebinize yanıt olarak size gönderiyoruz. Şifrenizi sıfırlamak için lütfen aşağıdaki butona tıklayın:</p><p style="text-align: left;"><a href="{{reset_link}}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Şifreyi Sıfırla</a></p><p>Bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p><p>Teşekkürler,</p><p>Sector Scout Ekibi</p>';

    let mailHtml = `<!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          /* CSS stillerini buraya ekleyebilirsin */
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background-color: #00b4c4;
            color: #ffffff;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            text-align: left;
          }
          .content p {
            font-size: 16px;
            line-height: 1.6;
          }
          .cta-button {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px;
            text-align: center;
            color: #ffffff;
            background-color: #00b4c4;
            text-decoration: none;
            font-size: 16px;
            border-radius: 4px;
          }
          .cta-button:visited,
          .cta-button:active {
            color: white;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #888888;
            padding: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Şifrenizi Sıfırlamak İçin Adımlar</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>
              Bu e-postayı, <strong>Sector Scout</strong> üzerinde şifrenizi
              sıfırlama talebinize yanıt olarak size gönderiyoruz. Şifrenizi
              sıfırlamak için lütfen aşağıdaki butona tıklayın:
            </p>
            <a style="color: #FFFFFF" href="{{reset_link}}" class="cta-button">Şifremi Sıfırla</a>
            <p>Bağlantıyı tıkladıktan sonra yeni şifrenizi oluşturabileceksiniz.</p>
            <p>Bu isteği siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
            <p>Teşekkür ederiz,</p>
            <p><strong>Sector Scout Ekibi</strong></p>
          </div>
          <div class="footer">
            <p>
              Bu mesajı yanıtlamayın. Yardım için
              <a href="mailto:support@sectorscout.com.tr">support@sectorscout.com.tr</a>
              adresine ulaşabilirsiniz.
            </p>
          </div>
        </div>
      </body>
    </html>
    `;

    const resetLink = BASE_URL + "resetPassword/" + token;

    mailHtml = mailHtml.replace("{{reset_link}}", resetLink);

    let mailOptions = {
      from: `"Sector Scout App" ${SMTP_SENDER}`,
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

cron.schedule("0 0 * * *", async () => {
  console.log("cron schedule started");
  try {
    const snapshot = await getSubsEndsUsers();
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const userId = doc.id;
        console.log("aboneliği bitiyor: ", userId, doc.data().email);

        //send to user notification
        const notifiedResponse = doc.data().email
          ? sendSubsEndNotificationMail(doc.data().email)
          : null;

        // Bildirim gönderildiyse true yap
        if (notifiedResponse) {
          updateUserSubsNotified(userId);

          console.log(
            "Abonelik bildirimleri başarıyla gönderildi: ",
            doc.data().email
          );
        }
      });
    }
  } catch (error) {
    console.error("Cron job sırasında hata oluştu:", error);
  }
});

function sendSubsEndNotificationMail(email) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail", // Google SMTP
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWD,
      },
    });

    // let mailHtml =
    //   '<p>Merhaba,</p><p>Bu e-postayı, Sector Scout abonelik bitimine 3 Gün kaldığını hatırlatırız. Keyifli kull.<p>Teşekkürler,</p><p>Sector Scout Ekibi</p>';

    let mailHtml = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background-color: #00b4c4;
            color: #ffffff;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            text-align: left;
          }
          .content p {
            font-size: 16px;
            line-height: 1.6;
          }
          .cta-button {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px;
            text-align: center;
            color: #ffffff;
            background-color: #00b4c4;
            text-decoration: none;
            font-size: 16px;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #888888;
            padding: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Aboneliğiniz Bitmek Üzere</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>
              <strong>Sector Scout</strong> aboneliğinizin bitiş tarihine yalnızca
              <strong>3 gün</strong> kaldı! Hizmetlerimizden yararlanmaya devam
              etmek ve kesintisiz erişim sağlamak için aboneliğinizi yenilemenizi
              öneririz.
            </p>
            <p>Teşekkür ederiz,</p>
            <p><strong>Sector Scout Ekibi</strong></p>
          </div>
          <div class="footer">
            <p>
              Bu mesajı yanıtlamayın. Yardım için
              <a href="mailto:support@sectorscout.com.tr"
                >support@sectorscout.com.tr</a
              >
              adresine ulaşabilirsiniz.
            </p>
          </div>
        </div>
      </body>
    </html>
    `;

    let mailOptions = {
      from: `"Sector Scout App" ${SMTP_SENDER}`,
      to: `${email}`,
      subject: "Abonelik Hatırlatma - Sector Scout",
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
    throw error;
  }
}

module.exports = {
  sendResetPasswordMail,
  sendSubsEndNotificationMail,
};
