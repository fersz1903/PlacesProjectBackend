const axios = require("axios");
const cheerio = require("cheerio");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function findEmailsFromWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 2000 });

    const $ = cheerio.load(data);

    let bodyText = $("body").text().replace(/\s+/g, " ").trim();

    const emails = bodyText.match(emailRegex);

    if (emails) {
      const uniqueEmails = [
        ...new Set(emails.map((email) => email.split(" ")[0])),
      ];

      const emailString = uniqueEmails.join(", ");
      return emailString;
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
