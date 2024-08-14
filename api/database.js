const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require("firebase-admin/firestore");
const uuid = require("uuid");

const serviceAccount = require("./serviceAccount.json");
const { response } = require("express");
const { createSignInToken, decodeToken } = require("./jwt");
require("dotenv").config();
const TOKEN_HEADER_KEY = process.env.TOKEN_HEADER_KEY;

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

function createUUId() {
  const newuuid = uuid.v4();
  console.log("userid: ", newuuid);
  return newuuid;
}

///#region test
async function addData() {
  const docRef = db.collection("users").doc("alovelace");

  await docRef.set({
    first: "Ada",
    last: "Lovelace",
    born: 1815,
  });
}

///#endregion test

async function getUserToken(username, password, res) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", username).get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      // token oluştur ve geri döndür
      const doc = snapshot.docs[0];

      if (checkPassword(password, doc.data().password)) {
        const token = createSignInToken(
          doc.id,
          doc.data().username,
          doc.data().role
        );
        return res.status(200).send({ result: true, data: token });
      } else {
        return res
          .status(401)
          .send({ result: false, data: "password incorrect" });
      }
    }
  } catch (error) {
    console.log("Cannot get user: ", error);
    return res
      .status(500)
      .send({ result: false, data: "Server Error, Cannot get user" });
  }
}

function checkPassword(reqPassword, password) {
  // TODO password hash required
  return reqPassword.toString() === password.toString();
}

async function registerUser() {
  try {
    const uuid = createUUId();
    const docRef = db.collection("users").doc(uuid.toString());

    await docRef.set({ first: "Ada", last: "Lovelace", born: 1815 });

    return true;
  } catch (error) {
    console.log("database error: ", error);
    return false;
  }
}

async function getUser(req, res) {
  console.log("getUser");
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const uid = decodeToken(token).userId;

    // find user and get properties
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      return res.status(200).send({
        result: true,
        data: {
          email: doc.data().email,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          phone: doc.data().phone,
          quota: doc.data().quota,
        },
      });
    }
  } catch (error) {
    return res.status(500).send({ result: false, data: error });
  }
}

module.exports = {
  getUserToken,
  getUser,
};
