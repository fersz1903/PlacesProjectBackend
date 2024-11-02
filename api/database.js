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
const Joi = require("joi");

const serviceAccount = require("./serviceAccount.json");
const { response } = require("express");
const { createSignInToken, decodeToken, verifyResetToken } = require("./jwt");
const { createHashedPassword, comparePassword } = require("./password.js");
const { setTokenRedis } = require("./cache");
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

const passwordSchema = Joi.object({
  password: Joi.string()
    .min(8) // En az 8 karakter uzunluğunda olmalı
    .messages({
      "string.min": "Şifre en az {#limit} karakter uzunluğunda olmalıdır.",
      "string.pattern.base":
        "Şifre en az bir büyük harf ve bir küçük harf içermelidir.",
    })
    .pattern(new RegExp("(?=.*[A-Z])")) // En az bir büyük harf içermeli
    .pattern(new RegExp("(?=.*[a-z])")) // En az bir küçük harf içermeli
    .pattern(new RegExp("(?=.*\\d)")) // En az bir rakam içermeli
    .rule({ message: "Şifre en az bir rakam içermelidir." }),
});

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
          doc.data().role,
          doc.data().subscriptionPlan ? doc.data().subscriptionPlan.id : null
        );
        await setTokenRedis(token, email);
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
      // TODO gruplanan userlara quota ref fieldi ekle, if quotaRef exist ise sharedData da işlem yap
      // quotaRef = doc.data().quota;
      // quotaDoc = await quotaRef.get();
      // console.log(quotaDoc.data().quota);
      return res.status(200).send({
        result: true,
        data: {
          email: doc.data().email,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          phone: doc.data().phone,
          quota: doc.data().quota,
          subscriptionEndDate:
            doc.data().subscriptionEndDate != null
              ? doc.data().subscriptionEndDate.toDate()
              : 0,
          subscriptionPlan: doc.data().subscriptionPlan
            ? doc.data().subscriptionPlan.id
            : null,
        },
      });
    }
  } catch (error) {
    console.log(error);
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
        subscriptionEndDate:
          doc.data().subscriptionEndDate != null
            ? doc.data().subscriptionEndDate.toDate()
            : 0,
        subscriptionPlan: doc.data().subscriptionPlan
          ? doc.data().subscriptionPlan.id
          : null,
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
    const { email, firstname, lastname, password, phone } = req.body;

    if (!(email && firstname && lastname && password && phone)) {
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

    if (!snapshot.exists) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    } else {
      // emailExists ?
      //console.log(await emailExists(uid, email));
      if ((await emailExists(uid, email)) === true) {
        return res
          .status(403)
          .json({ result: false, data: "Email already exists!" });
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
    if (!snapshot.exists) {
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

async function emailExists(uid, email) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    const emailExists = snapshot.docs.some((doc) => {
      // if email using by different uid return true
      return doc.id != uid;
    });

    return emailExists;
  } catch (error) {
    console.log("Cannot get user: ", error);
    return error;
  }
}

async function updateUserSubscription(req, res) {
  console.log("updateUserSubscription");
  try {
    const { uid, subscriptionType } = req.body;

    if (
      !(uid && subscriptionType) &&
      !["Lite", "Standart", "Premium"].includes(subscriptionType)
    ) {
      console.log(req.body);
      return res
        .status(400)
        .json({ result: false, data: "Missing or wrong properties of user!" });
    }
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    }

    const subRef = db.collection("subscriptionPlans").doc(subscriptionType);
    const subDoc = await subRef.get();

    const subsEndDate = new Date();
    subsEndDate.setDate(subsEndDate.getDate() + 30);

    const premiumRef = db.collection("subscriptionPlans").doc("Premium");
    const updateRes = await userRef.update({
      subscriptionEndDate: subsEndDate,
      subscriptionPlan: subRef,
      quota:
        subscriptionType === "Premium"
          ? snapshot.data().subscriptionPlan
            ? snapshot.data().subscriptionPlan.isEqual(premiumRef)
              ? FieldValue.increment(subDoc.data().quota)
              : subDoc.data().quota
            : subDoc.data().quota
          : subDoc.data().quota,
    });

    if (updateRes instanceof Error) {
      console.log(updateRes);
      return res.status(500).send({
        result: false,
        data: "User subscription could not write db",
      });
    }

    return res
      .status(200)
      .send({ result: true, data: "User subscription updated successfuly" });
  } catch (error) {
    console.log("Cannot update user subscription: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot update user subscription",
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

    const { error } = passwordSchema.validate({ password: newPassword });

    if (error) {
      // Eğer doğrulama hatası varsa, hata mesajını dön
      return res.status(403).send({
        result: false,
        data: error.details[0].message,
      });
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

// checks users request quota // TODO check quota more than 1
async function checkQuota(req, res) {
  console.log("check quota");
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    const { count } = req.params;

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const checkCount = count ? count : 1;

    const uid = decodeToken(token).userId;

    // find user and get properties
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).send({ result: false, data: "User Not Found" });
    }

    const quota = doc.data().quota;
    const subscriptionEndDate = doc.data().subscriptionEndDate;

    if (!subscriptionEndDate || isDatePassed(subscriptionEndDate.toDate())) {
      return res.status(402).send({
        result: false,
        data: "Subscription not found, payment required",
        quota: quota,
      });
    }

    if (quota >= checkCount) {
      return res.status(200).send({
        result: true,
        data: "User Quota Exist",
        quota: quota,
      });
    }
    return res.status(403).send({
      result: false,
      data: "User Quota Does Not Exist",
      err: "ERR_QUOTA",
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
    if (!snapshot.exists) {
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

async function increaseQuota(req, res) {
  console.log("increaseQuota");
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const { increment } = req.body;

    if (!increment && increment != 0) {
      console.log("buraya girdi", req.body);
      return res
        .status(400)
        .json({ result: false, data: "Missing properties" });
    }

    const uid = decodeToken(token).userId;

    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    }

    let quota = snapshot.data().quota;

    // if quota exist then decrease it
    quota += increment;
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
      data: "User quota increased successfuly",
      newQuota: quota,
    });
  } catch (error) {
    console.log("Cannot update user quota: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot increase user quota",
    });
  }
}

async function changePassword(req, res) {
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const { password, newPassword } = req.body;

    if (!(password && newPassword)) {
      console.log(req.body);
      return res
        .status(400)
        .json({ result: false, data: "Missing properties" });
    }

    const { error } = passwordSchema.validate({ password: newPassword });

    if (error) {
      // Eğer doğrulama hatası varsa, hata mesajını döneriz
      return res.status(400).send({
        result: false,
        data: error.details[0].message,
      });
    }

    const uid = decodeToken(token).userId;

    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      console.log("No matching documents.");
      return res.status(404).send({ result: false, data: "User Not Found" });
    }

    // check passwords equal
    const compareResult = await comparePassword(
      password,
      snapshot.data().password
    );

    if (compareResult != true) {
      return res
        .status(401)
        .send({ result: false, data: "password incorrect" });
    }

    const hashedPassword = await createHashedPassword(newPassword);

    await userRef.update({ password: hashedPassword });

    return res
      .status(200)
      .send({ result: true, data: "Password updated successfully" });
  } catch (error) {
    console.log("Change password error: ", error);
    return res
      .status(500)
      .send({ result: false, data: "Password change failed" });
  }
}

async function saveSearchResultsToDb(req, res) {
  try {
    const { data, name, address } = req.body;

    if (!(data && name && address)) {
      return res
        .status(400)
        .json({ result: false, error: "Missing properties" });
    }

    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const uid = decodeToken(token).userId;

    const searchRecCol = db
      .collection("users")
      .doc(uid)
      .collection("searchRecords");

    // file save quota
    const checkRes = await checkUserSaveFileLimit(uid, searchRecCol);

    if (!checkRes) {
      return res
        .status(403)
        .send({ result: false, data: "File save quota exceeded" });
    }

    const searchDocRef = searchRecCol.doc(name.toString().trim());

    // const rows = data.map((row) => ({
    //   address: row.formattedAddress,
    //   displayName: row.displayName.text,
    //   pricelevel: row.priceLevel !== undefined ? row.priceLevel : null, // undefined ise null yap
    // }));

    // console.log(rows);
    await searchDocRef.set({ data, address: address });

    return res
      .status(200)
      .send({ result: true, data: "File saved successfuly" });
  } catch (error) {
    console.log("error save search result", error);
    res.status(500).send({ result: false, data: "Error while saving file" });
  }
}

async function fileExists(req, res) {
  try {
    const token = req.header(TOKEN_HEADER_KEY);
    const { name } = req.params;
    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }
    if (!name) {
      return res
        .status(400)
        .json({ result: false, error: "Missing properties" });
    }

    const uid = decodeToken(token).userId;
    const fileRef = db
      .collection("users")
      .doc(uid)
      .collection("searchRecords")
      .doc(name.trim());

    const snapshot = await fileRef.get();

    if (!snapshot.exists) {
      return res
        .status(200)
        .send({ result: false, data: "File Does Not Exist" });
    }
    return res.status(200).send({ result: true, data: "File Exists" });
  } catch (error) {
    res.status(500).send({ result: false, data: "Error while checking file" });
  }
}

async function getSavedSearchResults(req, res) {
  console.log("getSavedSearchResults");
  try {
    const token = req.header(TOKEN_HEADER_KEY);

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    const uid = decodeToken(token).userId;

    const filesRef = db
      .collection("users")
      .doc(uid)
      .collection("searchRecords");

    const snapshot = await filesRef.get();

    if (snapshot.empty) {
      return res.status(404).send({ result: false, data: "Files Not Found" });
    }
    const filesArray = [];
    const filesCount = snapshot.size;

    snapshot.forEach((doc) => {
      filesArray.push({
        file: doc.id,
        address: doc.data().address ? doc.data().address : null,
      });
    });
    return res.status(200).send({
      result: true,
      files: filesArray,
      filesCount: filesCount,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ result: false, data: "An error occured while getting files" });
  }
}

async function getFile(req, res) {
  console.log("getFile");
  try {
    const token = req.header(TOKEN_HEADER_KEY);
    const { name } = req.params;

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    if (!name) {
      return res
        .status(400)
        .json({ result: false, error: "Missing properties" });
    }

    const uid = decodeToken(token).userId;

    const fileRef = db
      .collection("users")
      .doc(uid)
      .collection("searchRecords")
      .doc(name);

    const snapshot = await fileRef.get();

    if (!snapshot.exists) {
      return res.status(404).send({ result: false, data: "File Not Found" });
    }

    return res.status(200).send({
      result: true,
      address: snapshot.data().address,
      data: snapshot.data().data,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ result: false, data: "An error occured while getting file" });
  }
}

async function deleteFile(req, res) {
  try {
    const token = req.header(TOKEN_HEADER_KEY);
    const { name } = req.body;

    if (!token) {
      return res.status(404).send({ result: false, data: "Token Not Found" });
    }

    if (!name) {
      return res
        .status(400)
        .json({ result: false, error: "Missing properties" });
    }
    const uid = decodeToken(token).userId;

    const deleteRes = await db
      .collection("users")
      .doc(uid)
      .collection("searchRecords")
      .doc(name)
      .delete();

    if (deleteRes instanceof Error) {
      console.log(deleteRes);
      return res
        .status(500)
        .send({ result: false, data: "File could not deleted" });
    }
    return res
      .status(200)
      .send({ result: true, data: "File deleted successfuly" });
  } catch (error) {
    console.log("Cannot delete file: ", error);
    return res.status(500).send({
      result: false,
      data: "Server Error, cannot delete file",
    });
  }
}

function isDatePassed(targetDate) {
  // if passed return true
  const today = new Date();
  const target = new Date(targetDate);
  console.log("today", today);
  return today > target;
}

async function checkUserSaveFileLimit(uid, searchRecCol) {
  console.log("getUser");
  try {
    // find user and get properties
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      return false;
    }

    const snapshot = await searchRecCol.get();

    if (snapshot.empty) {
      return true;
    }

    const filesCount = snapshot.size;

    const planRef = doc.data().subscriptionPlan;
    const planDoc = await planRef.get();

    if (planDoc.exists) {
      return filesCount < planDoc.data().fileSaveLimit ? true : false; // true ise kayıt edilebilir -- limitin altında
    }
    return false;
  } catch (error) {
    //console.log(error);
    throw error;
    //return false;
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
  changePassword,
  emailExists,
  saveSearchResultsToDb,
  fileExists,
  getSavedSearchResults,
  getFile,
  deleteFile,
  updateUserSubscription,
  increaseQuota,
};
