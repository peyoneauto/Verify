const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ID المستخدم (Discord)
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);
