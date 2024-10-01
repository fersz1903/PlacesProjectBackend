const winston = require("winston");
const { decodeToken } = require("../jwt");
require("winston-daily-rotate-file");

const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/ss-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m", // max size of file
  maxFiles: "14d", // max day log
  zippedArchive: true, // zip old files
});

// Winston logger yapılandırması
const logger = winston.createLogger({
  level: "debug", // Log seviyesi (info, warn, error vs.)
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Zaman damgası
    winston.format.printf(
      ({ level, message, timestamp }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [
    //new winston.transports.Console(),
    //new winston.transports.File({ filename: "logs/app.log" }),
    dailyRotateTransport,
  ],
});

function writeInfoLog(req, res, next) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const token = req.header("Authorization");

    if (!token || token == null || token == "null") {
      res.on("finish", () => {
        logger.info(
          `Request: ${req.method} - ${req.url} - Guest - IP: ${ip} - Response Code: ${res.statusCode}`
        );
      });
    } else {
      const email = decodeToken(token).email;
      const user = email ? `User: ${email}` : "Guest"; // Kullanıcı bilgisi
      res.on("finish", () => {
        logger.info(
          `Request: ${req.method} - ${req.url} - ${user} - IP: ${ip} - Response Code: ${res.statusCode}`
        );
      });
    }
    next();
  } catch (error) {
    console.log("log error", error);
    next();
  }
}

function writeErrorLog(err, req, res, next) {
  try {
    logger.error(`Error: ${err.message}`);
    res.status(500).send("Internal Server Error");
    next();
  } catch (error) {
    console.log("log error");
    next();
  }
}

module.exports = { logger, writeInfoLog, writeErrorLog };
