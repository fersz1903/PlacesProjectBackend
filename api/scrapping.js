const axios = require("axios");
const cheerio = require("cheerio");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// async function findEmailsFromWebsite(url) {
//   try {
//     const { data } = await axios.get(url, { timeout: 2000 });

//     const $ = cheerio.load(data);

//     let bodyText = $("body").text().replace(/\s+/g, " ").trim();

//     const emails = bodyText.match(emailRegex);

//     if (emails) {
//       const uniqueEmails = [
//         ...new Set(emails.map((email) => email.split(" ")[0])),
//       ];

//       const emailString = uniqueEmails.join(", ");
//       return emailString;
//     }

//     return null;
//   } catch (error) {
//     console.error(`Error fetching ${url}: `, error.message);
//     return null;
//   }
// }

async function findEmailsFromWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 2000 });

    const $ = cheerio.load(data);

    // Önce "contact", "iletişim", "support" gibi başlıklar altında mail ara
    let potentialSections = $(
      "a, div, section, footer, header, p, span"
    ).filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return (
        text.includes("contact") ||
        text.includes("iletişim") ||
        text.includes("support") ||
        text.includes("help") ||
        text.includes("bize ulaşın")
      );
    });

    let bodyText = potentialSections.text().replace(/\s+/g, " ").trim();

    if (!bodyText) {
      bodyText = $("body").html();
      //.replace(/\s+/g, " ").trim();
    }

    const emails = bodyText.match(emailRegex);

    if (emails) {
      // Benzersiz e-postalar
      const uniqueEmails = [...new Set(emails)];

      // İstenmeyen formatları veya boşluklu mailleri ayıklamak için filtre
      const validEmails = uniqueEmails.filter((email) =>
        emailRegex.test(email.trim())
      );

      // İçinde "info", "contact", "support" vb. geçen e-postalar öne çıksın
      const prioritizedEmails = validEmails.filter(
        (email) =>
          email.toLowerCase().includes("info") ||
          email.toLowerCase().includes("contact") ||
          email.toLowerCase().includes("support") ||
          email.toLowerCase().includes("iletisim") ||
          email.toLowerCase().includes("destek")
      );

      // Eğer öncelikli e-posta varsa onu döndür
      const selectedEmails =
        prioritizedEmails.length > 0 ? prioritizedEmails : validEmails;

      return selectedEmails.join(", ");
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${url}: `, error.message);
    return null;
  }
}

async function handleData(req, res) {
  try {
    const searchData = req.body.data;

    if (!searchData) {
      return res.status(400).json({ result: false, error: "Missing data" });
    }

    for (const line of searchData) {
      //console.log(line);
      if (line.websiteUri) {
        const emails = await findEmailsFromWebsite(line.websiteUri);
        line.emails = emails ? emails : null;
      }
    }

    return res.status(200).send({ result: true, data: searchData });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      result: false,
      data: "An error occured while getting mail datas",
    });
  }
}

// findEmailsFromWebsite().then((emails) => {
//   console.log("E-posta Adresleri: ", emails);
// });

module.exports = { findEmailsFromWebsite, handleData };
