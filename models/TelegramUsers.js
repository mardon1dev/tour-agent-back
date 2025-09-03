// models/TelegramUser.js
const mongoose = require("mongoose");

const TelegramUserSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  username: String, // optional
  firstName: String,
  lastName: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TelegramUser", TelegramUserSchema);
