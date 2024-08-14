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

// ROUTES
const home = require("./Routes/home.js");
const login = require("./Routes/login.js");
const validate = require("./Routes/validate.js");

require("dotenv").config();

const PORT = process.env.PORT || 3001;
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

const corsOptions = {
  origin: "*", // React uygulamasının URL'si
  methods: ["GET", "POST"], // İzin verilen HTTP yöntemleri
};
const csrfProtection = csrf({ cookie: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

app.use("/home", tokenValidate, home);
app.use("/login", login);
app.use("/validate", validate);
