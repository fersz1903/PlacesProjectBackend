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
const { createSignInToken } = require("./jwt");

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

async function getUserToken(username, password) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", username).get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return { result: false, data: "User Not Found" };
    } else {
      // token oluştur ve geri döndür
      const doc = snapshot.docs[0];

      if (checkPassword(password, doc.data().password)) {
        const token = createSignInToken(doc.id, doc.data().username);
        return { result: true, data: token };
      } else {
        return { result: false, data: "password incorrect" };
      }
    }
  } catch (error) {
    console.log("Cannot get user: ", error);
    return { result: false, data: "Server Error" };
  }
}

function checkPassword(reqPassword, password) {
  // password hash required
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

module.exports = {
  addData,
  registerUser,
  getUserToken,
};
