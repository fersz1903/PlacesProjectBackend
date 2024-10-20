const axios = require("axios");
const cheerio = require("cheerio");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function findEmailsFromWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });

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

    const contactLink = $("a")
      .filter((i, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().toLowerCase();
        return (
          href &&
          (text.includes("contact") ||
            text.includes("iletişim") ||
            text.includes("support") ||
            text.includes("bize ulaşın")) &&
          !href.startsWith("#") // Boş veya aynı sayfa içi yönlendirmeleri dışla
        );
      })
      .first()
      .attr("href");

    // Eğer bir iletişim sayfası bağlantısı bulunursa, URL'yi oluştur ve iletişim sayfasına yönlendir
    if (contactLink) {
      // İletişim linkinin tam URL'sini oluştur
      const contactPageUrl = new URL(contactLink, url).href;
      console.log(`İletişim sayfası bulundu: ${contactPageUrl}`);

      // İletişim sayfasındaki e-posta adreslerini ara
      const contactPageEmails = await findEmailsFromContactPage(contactPageUrl);
      if (contactPageEmails) {
        return contactPageEmails;
      }
    }

    let bodyText = potentialSections.text().replace(/\s+/g, " ").trim();

    if (!bodyText) {
      bodyText = $("body").text().replace(/\s+/g, " ").trim();
    }

    const mailtoLinks = [];
    $('a[href^="mailto:"]').each((index, element) => {
      mailtoLinks.push($(element).attr("href").replace("mailto:", ""));
    });

    const emails = bodyText.match(emailRegex);

    if (emails) {
      // Benzersiz e-postalar
      const uniqueEmails = [...new Set([...emails, ...mailtoLinks])];

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

async function findEmailsFromContactPage(url) {
  try {
    const { data } = await axios.get(url, { timeout: 2000 });
    const $ = cheerio.load(data);

    let bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // mailto linklerinden mailleri çek
    const mailtoLinks = [];
    $('a[href^="mailto:"]').each((index, element) => {
      mailtoLinks.push($(element).attr("href").replace("mailto:", ""));
    });

    // Metinden e-postaları çek
    const emails = bodyText.match(emailRegex);

    if (emails) {
      const uniqueEmails = [...new Set([...emails, ...mailtoLinks])];
      return uniqueEmails.join(", ");
    }

    return null;
  } catch (error) {
    console.error(`Error fetching contact page ${url}: `, error.message);
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

async function handleScrap(data) {
  try {
        for (const line of data) {
      //console.log(line);
      if (line.websiteUri) {
        const emails = await findEmailsFromWebsite(line.websiteUri);
        line.emails = emails ? emails : null;
      }
    }

    return data;
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

module.exports = { findEmailsFromWebsite, handleData, handleScrap };
