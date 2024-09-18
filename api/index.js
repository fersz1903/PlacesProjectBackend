const { addData, registerUser, getUserToken } = require("./database.js");
const { createSignInToken, validateToken } = require("./jwt.js");
const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const tokenValidate = require("./Middlewares/tokenValidation.js");
const isAdmin = require("./Middlewares/isAdmin.js");
const { rateLimit } = require("express-rate-limit");
const { validateLimiter } = require("./Middlewares/rateLimiter.js");

// ROUTES
const home = require("./Routes/home.js");
const login = require("./Routes/login.js");
const validate = require("./Routes/validate.js");
const admin = require("./Routes/admin.js");
const user = require("./Routes/user.js");

require("dotenv").config();

const PORT = process.env.PORT || 3001;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

const corsOptions = {
  origin: "*", // React uygulamasının URL'si
  methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP yöntemleri
};
const csrfProtection = csrf({ cookie: true });

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 11, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: "Çok Fazla İstek Yapıldı, Lütfen Daha Sonra Tekrar Deneyin",
  validate: { xForwardedForHeader: false },
});

// app.use(limiter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

app.use("/home", tokenValidate, home);
app.use("/login", loginLimiter, login);
app.use("/validate", validateLimiter, validate);
app.use("/admin", [tokenValidate, isAdmin], admin);
app.use("/user", user);
