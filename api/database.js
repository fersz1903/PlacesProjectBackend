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
const { createSignInToken, decodeToken, verifyResetToken } = require("./jwt");
const { createHashedPassword, comparePassword } = require("./password.js");
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

//#region test

//#endregion

async function getUserToken(email, password, res) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      // token oluştur ve geri döndür
      const doc = snapshot.docs[0];

      if ((await comparePassword(password, doc.data().password)) == true) {
        const token = createSignInToken(
          doc.id,
          doc.data().email,
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
    return res
      .status(500)
      .send({ result: false, data: "An error occured getting user infos" });
  }
}

async function userExist(email) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();
    return !snapshot.empty; // if user exist returns true
  } catch (error) {
    console.log("Cannot get user: ", error);
    return error;
  }
}

//#region admin funcs
async function getUsers(req, res) {
  console.log("getUsers");
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    if (snapshot.empty) {
      return res.status(404).send({ result: false, data: "Users Not Found" });
    }
    const usersArray = [];
    const userCount = snapshot.size;

    snapshot.forEach((doc) => {
      usersArray.push({
        uid: doc.id,
        email: doc.data().email,
        firstname: doc.data().firstname,
        lastname: doc.data().lastname,
        phone: doc.data().phone,
        quota: doc.data().quota,
        role: doc.data().role,
        registrationDate:
          doc.data().registrationDate != null
            ? doc.data().registrationDate.toDate()
            : 0,
      });
    });
    return res.status(200).send({
      result: true,
      users: usersArray,
      userCount: userCount,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ result: false, data: "An error occured while getting users" });
  }
}

async function registerUser(req, res) {
  try {
    const { email, firstname, lastname, password, phone, quota } = req.body;

    if (!(email && firstname && lastname && password && phone && quota)) {
      return res
        .status(400)
        .json({ result: false, data: "Missing properties of user!" });
    }

    if ((await userExist(email)) === true) {
      return res
        .status(403)
        .json({ result: false, data: "User already exists!" });
    }

    const uuid = createUUId();
    const docRef = db.collection("users").doc(uuid.toString());

    const hashedPassword = await createHashedPassword(password);

    await docRef.set({
      email: email,
      firstname: firstname,
      lastname: lastname,
      password: hashedPassword,
      phone: phone,
      quota: quota,
      registrationDate: Timestamp.now(),
      role: "user",
    });

    return res
      .status(200)
      .send({ result: true, data: "User registered successfuly" });
  } catch (error) {
    console.log("Cannot register user: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, Cannot register user",
    });
  }
}

async function getUsersCount(req, res) {
  console.log("getUsersCount");
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    if (snapshot.empty) {
      return res.status(404).send({ result: false, data: "Users Not Found" });
    }
    const userCount = snapshot.size;
    return res.status(200).send({
      result: true,
      usersCount: userCount,
    });
  } catch (error) {
    return res.status(500).send({
      result: false,
      data: "An error occured while getting users count",
    });
  }
}

async function updateUser(req, res) {
  console.log("updateUser");
  try {
    const { uid, email, firstname, lastname, phone, role } = req.body;

    if (!(uid && email && firstname && lastname && phone && role)) {
      console.log(req.body);
      return res
        .status(400)
        .json({ result: false, data: "Missing properties of user!" });
    }
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      if ((await userExist(email)) === true) {
        return res
          .status(403)
          .json({ result: false, data: "User already exists!" });
      }

      const updateRes = await userRef.update({
        email: email,
        firstname: firstname,
        lastname: lastname,
        phone: phone,
        role: role,
      });

      if (updateRes instanceof Error) {
        console.log(updateRes);
        return res
          .status(500)
          .send({ result: false, data: "User infos could not write db" });
      }
    }
    return res
      .status(200)
      .send({ result: true, data: "User updated successfuly" });
  } catch (error) {
    console.log("Cannot update user: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot update user",
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res
        .status(400)
        .json({ result: false, data: "Missing properties of user!" });
    }
    const deleteRes = await db.collection("users").doc(uid).delete();
    if (deleteRes instanceof Error) {
      console.log(deleteRes);
      return res
        .status(500)
        .send({ result: false, data: "User could not deleted" });
    }

    return res
      .status(200)
      .send({ result: true, data: "User deleted successfuly" });
  } catch (error) {
    console.log("Cannot delete user: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot delete user",
    });
  }
}

async function updateUserQuota(req, res) {
  console.log("updateUserQuota");
  try {
    const { uid, quota } = req.body;

    if (!(uid && quota)) {
      console.log(req.body);
      return res
        .status(400)
        .json({ result: false, data: "Missing properties of user!" });
    }
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      const updateRes = await userRef.update({
        quota: quota,
      });

      if (updateRes instanceof Error) {
        console.log(updateRes);
        return res
          .status(500)
          .send({ result: false, data: "User quota could not write db" });
      }
    }
    return res
      .status(200)
      .send({ result: true, data: "User quota updated successfuly" });
  } catch (error) {
    console.log("Cannot update user quota: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot update user quota",
    });
  }
}

//#endregion

async function writeResetTokenUser(email, token) {
  console.log("writeResetToken:", email);
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return false;
    }
    const doc = snapshot.docs[0];

    const userRef = db.collection("users").doc(doc.id);

    const res = await userRef.set(
      {
        resetToken: token,
      },
      { merge: true }
    );
    return res;
  } catch (error) {
    return error;
  }
}

async function isResetTokenTrue(email, token) {
  console.log("confirm reset token:", email);
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return false;
    }
    const doc = snapshot.docs[0];

    console.log("token equal: ", doc.data().resetToken == token);

    return doc.data().resetToken == token;
  } catch (error) {
    return error;
  }
}

async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;
    const token = req.header(TOKEN_HEADER_KEY);

    // check token exist
    if (!token) {
      return res.status(404).json({ result: false, data: "No token provided" });
    }
    // check parameter exist
    if (!newPassword) {
      return res
        .status(400)
        .json({ result: false, data: "newPassword required" });
    }

    // verify token
    const decoded = verifyResetToken(token);
    if (decoded instanceof Error) {
      return res
        .status(400)
        .json({ result: false, data: "Invalid or expired token" });
    }

    // is token equal to from db token
    const isTokenTrue = await isResetTokenTrue(decoded.email, token);
    if (isTokenTrue instanceof Error || isTokenTrue != true) {
      return res
        .status(400)
        .json({ result: false, data: "Invalid or expired token" });
    }

    // update user with new password
    const isUpdateSuccess = await updatePassword(decoded.email, newPassword);
    console.log("decoded email", decoded.email);
    if (isUpdateSuccess instanceof Error || isUpdateSuccess != true) {
      console.log(isUpdateSuccess);
      return res
        .status(400)
        .json({ result: false, data: "Invalid or expired token" });
    }
    return res
      .status(200)
      .json({ result: true, data: "Password reset successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ result: false, data: "An unexpected error occurred" });
  }
}

async function updatePassword(email, newPassword) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return false;
    }
    const doc = snapshot.docs[0];
    const userRef = usersRef.doc(doc.id);
    const hashedPassword = await createHashedPassword(newPassword);

    const res = await userRef.update({ password: hashedPassword });
    return true;
  } catch (error) {
    return error;
  }
}

// checks users request quota
async function checkQuota(req, res) {
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
    }

    const quota = doc.data().quota;
    if (quota > 0) {
      return res.status(200).send({
        result: true,
        data: "User Quota Exist",
        quota: quota,
      });
    }
    return res.status(403).send({
      result: false,
      data: "User Quota Does Not Exist",
      quota: quota,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ result: false, data: "An error occured checking user quota" });
  }
}

async function decraseQuota(req, res) {
  console.log("decraseUserQuota");
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const uid = decodeToken(token).userId;

    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    }

    let quota = snapshot.data().quota;

    if (quota <= 0) {
      return res.status(403).send({
        result: false,
        data: "User Quota Does Not Exist",
        quota: quota,
      });
    }
    // if quota exist then decrease it
    --quota;
    const updateRes = await userRef.update({
      quota: quota,
    });

    if (updateRes instanceof Error) {
      console.log(updateRes);
      return res
        .status(500)
        .send({ result: false, data: "User new quota could not write db" });
    }

    return res.status(200).send({
      result: true,
      data: "User quota decreased successfuly",
      newQuota: quota,
    });
  } catch (error) {
    console.log("Cannot update user quota: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot decrease user quota",
    });
  }
}

module.exports = {
  getUserToken,
  getUser,
  getUsers,
  registerUser,
  writeResetTokenUser,
  isResetTokenTrue,
  resetPassword,
  getUsersCount,
  updateUser,
  deleteUser,
  updateUserQuota,
  checkQuota,
  decraseQuota,
};
