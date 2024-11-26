require("dotenv").config();
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const BASE_URL = process.env.BASE_URL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWD = process.env.SMTP_PASSWD;
const SMTP_SENDER = process.env.SMTP_SENDER;

async function sendEmailVerificationMail(token, email) {
  try {
    // send mail
    let transporter = nodemailer.createTransport({
      service: "gmail", // Google SMTP
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWD,
      },
    });

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
            <h1>Email Doğrulama Adımları</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>
              Bu e-postayı, <strong>Sector Scout</strong> üzerinde mail adresinizi
              doğrulamanız için size gönderiyoruz. Mail adresinizi doğrulamak için
              lütfen aşağıdaki butona tıklayın:
            </p>
            <a style="color: #ffffff" href="{{email_verificate}}" class="cta-button"
              >Maili Doğrula</a
            >
            <p>Bağlantıyı tıkladıktan sonra mailiniz doğrulanacaktır.</p>
            <p>Bu isteği siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
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

    const verificationLink = BASE_URL + "emailVerification/" + token;
    mailHtml = mailHtml.replace("{{email_verificate}}", verificationLink);

    let mailOptions = {
      from: `"Sector Scout App" ${SMTP_SENDER}`,
      to: `${email}`,
      subject: "Email Doğrulama - Sector Scout",
      html: mailHtml,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Hata oluştu: ", error);
        return error;
      }
      console.log("Mail başarıyla gönderildi: %s", info.messageId);
    });
  } catch (error) {
    console.log("mail error:", error);
  }
}

module.exports = { sendEmailVerificationMail };
