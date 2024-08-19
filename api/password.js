const bcrypt = require("bcryptjs");
const saltRounds = 10;

async function createHashedPassword(plainPassword) {
  console.log("create passwd: ", plainPassword);
  return await bcrypt.hash(plainPassword, saltRounds);
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  createHashedPassword,
  comparePassword,
};
