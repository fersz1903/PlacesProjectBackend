const express = require("express");
const router = express.Router();
const {
  getUser,
  checkQuota,
  decraseQuota,
  changePassword,
  saveSearchResultsToDb,
  fileExists,
  getSavedSearchResults,
  getFile,
  deleteFile,
} = require("../database.js");
const { downloadExcel } = require("../excel.js");
const {
  limiter,
  getUserLimiter,
  downloadLimiter,
  resetPasswordLimiter,
  checkQuotaLimiter,
} = require("../Middlewares/rateLimiter.js");
const { handleData } = require("../scrapping.js");
const { scrapingQueue } = require("../scrappingQueue.js"); // Kuyruk fonksiyonu

// "url/home/<>"

router.get("/", limiter, (req, res) => {
  res.json({ message: "Merhaba, Sector Scout API'ye hoş geldinnn!" });
});

router.get("/getUser", getUserLimiter, async (req, res) => {
  return await getUser(req, res);
});

router.post("/downloadExcel", downloadLimiter, (req, res) => {
  return downloadExcel(req, res);
});

// check quota if q>0 return yes
router.get("/checkQuota", checkQuotaLimiter, async (req, res) => {
  //  TODO add quota limiter
  return await checkQuota(req, res);
});

router.put("/decreaseQuota", async (req, res) => {
  return await decraseQuota(req, res);
});

router.put("/changePassword", resetPasswordLimiter, async (req, res) => {
  return await changePassword(req, res);
});

router.post("/saveSearchResults", async (req, res) => {
  return await saveSearchResultsToDb(req, res);
});

router.get("/checkFileExists/:name", checkQuotaLimiter, async (req, res) => {
  return await fileExists(req, res);
});

router.get("/getSavedSearchResults", getUserLimiter, async (req, res) => {
  return await getSavedSearchResults(req, res);
});

router.get("/getFile/:name", async (req, res) => {
  return await getFile(req, res);
});

router.delete("/deleteFile", async (req, res) => {
  return await deleteFile(req, res);
});

// router.post("/getEmails", async (req, res) => {
//   return await handleData(req, res);
// });

router.post("/getEmails", async (req, res) => {
  try {
    const searchData = req.body.data;

    if (!searchData) {
      return res.status(400).json({ result: false, error: "Missing data" });
    }

    if ((await scrapingQueue.count()) > 15) {
      res.status(403).json({ result: false, data: "reached max queue size" });
    } else {
      const job = await scrapingQueue.add("scrape-job", {
        data: req.body.data,
      });
      res.json({ jobId: job.id, status: "pending" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding job to queue", error: error.message });
  }
});

router.get("/getScrapStatus/:jobId", async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const job = await scrapingQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const jobStatus = {
      id: job.id,
      name: job.name,
      isActive: await job.isActive(),
      result: job.finishedOn ? job.returnvalue : null,
      failedReason: job.failedReason,
      createdAt: job.createdAt,
      finishedAt: job.finishedOn,
      progress: job.progress,
    };

    res.json(jobStatus);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching job status", error: error.message });
  }
});

module.exports = router;
