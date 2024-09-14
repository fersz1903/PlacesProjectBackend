const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

function downloadExcel(req, res) {
  try {
    const jsonData = req.body.data;

    if (!jsonData) {
      return res.status(400).json({ result: false, error: "Missing data" });
    }

    // JSON verisini işleyip Excel çalışma kitabı oluşturma
    const workbook = xlsx.utils.book_new();

    const rows = jsonData.map((row) => ({
      address: row.formattedAddress,
      displayName: row.displayName.text,
      pricelevel: row.priceLevel,
    }));

    // const worksheet = xlsx.utils.json_to_sheet(jsonData);
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Places");

    xlsx.utils.sheet_add_aoa(worksheet, [["Adres", "İsim", "Price Level"]], {
      origin: "A1",
    });
    //const max_width = rows.reduce((w, r) => Math.max(w, r.address.length), 10);
    worksheet["!cols"] = [{ wch: 50 }, { wch: 30 }, { wch: 30 }];

    // Excel dosyasını kaydetme
    const excelFilePath = path.join(__dirname, "output.xlsx");
    xlsx.writeFile(workbook, excelFilePath);

    // Kullanıcıya Excel dosyasını indirme imkânı sağlama
    res.download(excelFilePath, "output.xlsx", (err) => {
      if (err) {
        console.error("Excel indirme hatası:", err);
        fs.unlinkSync(excelFilePath);
        res
          .status(500)
          .send({ result: false, data: "Error while downloading file" });
      } else {
        // Dosya indirildikten sonra sunucudan kaldırma
        fs.unlinkSync(excelFilePath);
      }
    });
  } catch (error) {
    console.log("error download excel", error);
    res
      .status(500)
      .send({ result: false, data: "Error while downloading file" });
  }
}

module.exports = {
  downloadExcel,
};
