const { Queue, Worker } = require("bullmq");
const redisClient = require("./redisClient"); // Redis client'ınızı dahil edin
const { handleData, handleScrap } = require("./scrapping");

// Scraping için kuyruk oluşturun
const scrapingQueue = new Queue("scraping", {
  connection: redisClient,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

// Scraping işlerini işleyen worker
const worker = new Worker(
  "scraping",
  async (job) => {
    const { data } = job.data;
    console.log("Scraping job started: ", job.id);

    // İsteği işleyin ve sonuçları döndürün
    const result = await handleScrap(data);

    setTimeout(async () => {
      await job.remove(); // İşi sil
    }, 1000 * 30 * 1); // 30 saniye

    return result;
  },
  { connection: redisClient, concurrency: 10 }
);

// İş başarıyla tamamlandığında bu olay tetiklenir.
worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed:`);
});

// İş başarısız olduğunda bu olay tetiklenir.
worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = { scrapingQueue };
