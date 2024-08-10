const { addData, registerUser, getUserToken } = require("./database.js");
const { createSignInToken, validateToken } = require("./jwt.js");
const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

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
//token validation middleware. in commentline during dev.
app.use((req, res, next) => {
  if (req.path === "/api/signin" || "/api/validateToken") {
    return next(); // Signin ve token valideate isteğini atla
  }
  const token = req.header(TOKEN_HEADER_KEY);
  if (validateToken(token)) next();
  else res.status(401).send();
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

app.get("/api", (req, res) => {
  res.json({ message: "Merhaba, CustomerCompass API'ye hoş geldinnn!" });
});

app.get("/api/registerUser", async (req, res) => {
  const response = await registerUser();
  console.log(response);
  if (response) {
    res.status(200).send({ result: true });
  } else {
    res.status(400).send({ result: false });
  }
});

app.post("/api/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const response = await getUserToken(username, password);

    if (response.result) {
      res.status(200).send({ response });
    } else {
      res.status(404).send({ response });
    }
  } catch (error) {
    res.status(501).send({ error: "Server Error!" });
  }
});

// token validation
app.post("/api/validateToken", (req, res) => {
  const token = req.header(TOKEN_HEADER_KEY);
  const status = validateToken(token);
  if (status) {
    res.status(200).send(true);
  } else {
    res.status(401).send(false);
  }
});

app.post("/api/addPlaces", (req, res) => {});
