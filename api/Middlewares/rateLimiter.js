const { rateLimit } = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  limit: 5, // Limit each IP to 1 requests per `window`
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 11,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const getUserLimiter = rateLimit({
  windowMs: 1 * 30 * 1000, // 30 sec
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const downloadLimiter = rateLimit({
  windowMs: 1 * 30 * 1000, // 30 sec
  limit: 1,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const quotaLimiter = rateLimit({
  windowMs: 1 * 10 * 1000, // 10 sec
  limit: 1,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const sendMailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

const validateLimiter = rateLimit({
  windowMs: 1 * 10 * 1000, // 10 sec
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

module.exports = {
  loginLimiter,
  limiter,
  getUserLimiter,
  downloadLimiter,
  quotaLimiter,
  resetPasswordLimiter,
  sendMailLimiter,
  validateLimiter,
};
