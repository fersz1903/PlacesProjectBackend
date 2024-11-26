const axios = require("axios");
const cheerio = require("cheerio");
const { Buffer } = require("buffer");

//const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// async function findEmailsFromWebsite(url) {
//   try {
//     const { data } = await axios.get(url, { timeout: 5000 });

//     const $ = cheerio.load(data);

//     // Önce "contact", "iletişim", "support" gibi başlıklar altında mail ara
//     let potentialSections = $(
//       "a, div, section, footer, header, p, span"
//     ).filter((i, el) => {
//       const text = $(el).text().toLowerCase();
//       return (
//         text.includes("contact") ||
//         text.includes("iletişim") ||
//         text.includes("support") ||
//         text.includes("help") ||
//         text.includes("bize ulaşın")
//       );
//     });

//     const contactLink = $("a")
//       .filter((i, el) => {
//         const href = $(el).attr("href");
//         const text = $(el).text().toLowerCase();
//         return (
//           href &&
//           (text.includes("contact") ||
//             text.includes("iletişim") ||
//             text.includes("support") ||
//             text.includes("bize ulaşın")) &&
//           !href.startsWith("#") // Boş veya aynı sayfa içi yönlendirmeleri dışla
//         );
//       })
//       .first()
//       .attr("href");

//     // Eğer bir iletişim sayfası bağlantısı bulunursa, URL'yi oluştur ve iletişim sayfasına yönlendir
//     if (contactLink) {
//       // İletişim linkinin tam URL'sini oluştur
//       const contactPageUrl = new URL(contactLink, url).href;
//       console.log(`İletişim sayfası bulundu: ${contactPageUrl}`);

//       // İletişim sayfasındaki e-posta adreslerini ara
//       const contactPageEmails = await findEmailsFromContactPage(contactPageUrl);
//       if (contactPageEmails) {
//         return contactPageEmails;
//       }
//     }

//     let bodyText = potentialSections.text().replace(/\s+/g, " ").trim();

//     if (!bodyText) {
//       bodyText = $("body").text().replace(/\s+/g, " ").trim();
//     }

//     const mailtoLinks = [];
//     $('a[href^="mailto:"]').each((index, element) => {
//       mailtoLinks.push($(element).attr("href").replace("mailto:", ""));
//     });

//     const emails = bodyText.match(emailRegex);

//     if (emails) {
//       // Benzersiz e-postalar
//       const uniqueEmails = [...new Set([...emails, ...mailtoLinks])];

//       // İstenmeyen formatları veya boşluklu mailleri ayıklamak için filtre
//       const validEmails = uniqueEmails.filter((email) =>
//         emailRegex.test(email.trim())
//       );

//       // İçinde "info", "contact", "support" vb. geçen e-postalar öne çıksın
//       const prioritizedEmails = validEmails.filter(
//         (email) =>
//           email.toLowerCase().includes("info") ||
//           email.toLowerCase().includes("contact") ||
//           email.toLowerCase().includes("support") ||
//           email.toLowerCase().includes("iletisim") ||
//           email.toLowerCase().includes("destek")
//       );

//       // Eğer öncelikli e-posta varsa onu döndür
//       const selectedEmails =
//         prioritizedEmails.length > 0 ? prioritizedEmails : validEmails;

//       return selectedEmails.join(", ");
//     }

//     return null;
//   } catch (error) {
//     console.error(`Error fetching ${url}: `, error.message);
//     return null;
//   }
// }

// const keywords = [
//   "contact",
//   "help",
//   "about us",
//   "İletişim".toLowerCase(),
//   "support",
//   "Bize Ulaşın".toLowerCase(),
//   "Biz bil".toLowerCase(),
//   "Hakkımızda".toLowerCase(),
//   "تواصل معنا".toLowerCase(),
//   "контакты".toLowerCase(),
//   "contatti",
//   "Contate",
//   "Contáctanos".toLowerCase(),
//   "kontakt",
//   "komuniki",
//   "karriera",
//   "kapcsolat",
//   "ΜΕΙΝΕΤΕ ΣΕ ΕΠΑΦΗ".toLowerCase(),
//   "Επικοινωνία".toLowerCase(),
//   "БАЙЛАНЫС ДЕРЕКТЕМЕЛЕРІ".toLowerCase(),
//   "고객 안내".toLowerCase(),
//   "боюнч байланышыңыз".toLowerCase(),
//   "Sazināšanās ar mums".toLowerCase(),
//   "Бидэнтэй холбоо барина уу".toLowerCase(),
//   "Контактирај со нас".toLowerCase(),
//   "زمونږ په اړه  ارتباط".toLowerCase(),
//   "Связаться".toLowerCase(),
//   "ƏLAQƏ".toLowerCase(),
//   "КОНТАКТУ".toLowerCase(),
//   "接触".toLowerCase(),
//   "联系我们".toLowerCase(),
//   "nala soo xidhiidh",
//   "Hafa samband",
//   "work with us",
// ];

const keywordsPrimary = [
  "contact",
  "İletişim".toLowerCase(),
  "support",
  "Bize Ulaşın".toLowerCase(),
  "Biz bil".toLowerCase(),
  "تواصل معنا".toLowerCase(),
  "контакты".toLowerCase(),
  "contatti",
  "Contate",
  "Contáctanos".toLowerCase(),
  "kontakt",
  "komuniki",
];

const keywordsSecondary = [
  "about us",
  "help",
  "Hakkımızda".toLowerCase(),
  "karriera",
  "kapcsolat",
  "ΜΕΙΝΕΤΕ ΣΕ ΕΠΑΦΗ".toLowerCase(),
  "Επικοινωνία".toLowerCase(),
  "БАЙЛАНЫС ДЕРЕКТЕМЕЛЕРІ".toLowerCase(),
  "고객 안내".toLowerCase(),
  "боюнч байланышыңыз".toLowerCase(),
  "Sazināšanās ar mums".toLowerCase(),
  "Бидэнтэй холбоо барина уу".toLowerCase(),
  "Контактирај со нас".toLowerCase(),
  "زمونږ په اړه  ارتباط".toLowerCase(),
  "Связаться".toLowerCase(),
  "ƏLAQƏ".toLowerCase(),
  "КОНТАКТУ".toLowerCase(),
  "Hubungi".toLowerCase(),
  "接触".toLowerCase(),
  "联系我们".toLowerCase(),
  "nala soo xidhiidh",
  "Hafa samband",
  "work with us",
];

const HIDDEN_AT_SYM = ["(at)", "[at]", "(@)", "[@]"];
const HIDDEN_DOT_SYM = ["(dot)", "[dot]", "(.)", "[.]"];

// Exclusion seesm better than inclusion of all tlds'..
const FORBIDDEN_TYPES = [
  ".jpg",
  ".png",
  ".tiff",
  ".gif",
  ".jpg2000",
  "sentry-next.wixpress.com",
  "sentry.wixpress.com",
  "sentry.io",
  "example.com",
  ".js",
  "abc.xyz",
];

const FORBIDDEN_CONTAINS = [
  "app-smart",
  "sentry",
  "844eecb5a0da4da99b3918516f5a379d",
];

escapeSym = (sym) => {
  return sym
    .replace("(", "\\(")
    .replace(")", "\\)")
    .replace("[", "\\[")
    .replace("]", "\\]");
};

const AT_REGEXES = HIDDEN_AT_SYM.map((item) => {
  return new RegExp(`\\s?${escapeSym(item)}\\s?`, "g");
});

const DOT_REGEXES = HIDDEN_DOT_SYM.map((item) => {
  return new RegExp(`\\s?${escapeSym(item)}\\s?`, "g");
});

const EMAIL_REGEX = /\b([A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6})\b/g;

extractEmails = (html) => {
  if (html == null || html == undefined) {
    return null;
  }

  AT_REGEXES.forEach((item) => {
    html = html.replace(item, "@");
  });

  DOT_REGEXES.forEach((item) => {
    html = html.replace(item, ".");
  });

  const matches = [...html.matchAll(EMAIL_REGEX)];

  if (matches && matches.length > 0) {
    return matches
      .filter((item) => {
        // Exlude if forbidden
        for (var i = 0; i < FORBIDDEN_TYPES.length; i++) {
          if (item[1].endsWith(FORBIDDEN_TYPES[i])) return false;
        }
        for (var i = 0; i < FORBIDDEN_CONTAINS.length; i++) {
          if (item[1].includes(FORBIDDEN_CONTAINS[i])) return false;
        }
        return true;
      })
      .map((item) => {
        return item[1];
      });
  }

  return null;
};

deobfuscateHtml = (html) => {
  if (html == null || html == undefined) {
    return undefined;
  }

  const ATOB_REGEX = /atob\([\'"]([A-Za-z0-9+\/]+)[\'"]\)/gm;

  replaceAtob = (match, p1, p2, p3, offset, string) => {
    return Buffer.from(p1, "base64").toString("binary");
  };

  // clean html
  // 1. Remove images
  let cleanedHtml = html.replace(/<img[^>]*>/g, "");

  // Escape the html
  let unescapedHtml = unescape(cleanedHtml);
  // Replace the encoded tags
  unescapedHtml = unescapedHtml.replace(ATOB_REGEX, replaceAtob);

  return unescapedHtml;
};

async function findEmailsFromWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });

    const $ = cheerio.load(data);

    const emails = extractEmails(deobfuscateHtml(data));

    // anasayfada bulunan mailleri döndür
    if (emails && emails.length > 0) {
      console.log("anasayfada email bulundu: ", url);
      // Benzersiz e-postalar
      const uniqueEmails = [...new Set([...emails])].slice(0, 5);

      return uniqueEmails.join(", ");
    }

    //anasayfada mail yoksa iletişim sayfası araştırması yap
    const contactLink = $("a")
      .filter((i, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().replace(/\s+/g, " ").trim().toLowerCase();
        return (
          href &&
          keywordsPrimary.some((keyword) => text.includes(keyword)) &&
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
    const contactLink2 = $("a")
      .filter((i, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().replace(/\s+/g, " ").trim().toLowerCase();
        return (
          href &&
          keywordsSecondary.some((keyword) => text.includes(keyword)) &&
          !href.startsWith("#") // Boş veya aynı sayfa içi yönlendirmeleri dışla
        );
      })
      .first()
      .attr("href");

    if (contactLink2) {
      // İletişim linkinin tam URL'sini oluştur
      const contactPageUrl = new URL(contactLink2, url).href;
      console.log(`İletişim sayfası bulundu: ${contactPageUrl}`);
      // İletişim sayfasındaki e-posta adreslerini ara
      const contactPageEmails = await findEmailsFromContactPage(contactPageUrl);
      if (contactPageEmails) {
        return contactPageEmails;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${url}: `, error.message);
    return null;
  }
}

async function findEmailsFromContactPage(url) {
  try {
    const { data } = await axios.get(url, { timeout: 3000 });
    const $ = cheerio.load(data);

    // Metinden e-postaları çek
    const emails = extractEmails(deobfuscateHtml(data));

    if (emails && emails.length > 0) {
      const uniqueEmails = [...new Set([...emails])].slice(0, 5);
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
