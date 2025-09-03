// bot.js
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const TelegramUser = require("./models/TelegramUsers"); // import model

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// Handle /start from users
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const username = msg.chat.username;
  const firstName = msg.chat.first_name;
  const lastName = msg.chat.last_name;

  try {
    // upsert (create if not exists)
    await TelegramUser.findOneAndUpdate(
      { chatId },
      { username, firstName, lastName },
      { upsert: true, new: true }
    );

    bot.sendMessage(
      chatId,
      "✅ You are now subscribed to Tour Agency notifications!"
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Failed to subscribe. Please try again later.");
  }
});

// Function to send a notification to all users in DB
const sendTelegramNotification = async (text) => {
  const users = await TelegramUser.find();
  for (const user of users) {
    try {
      await bot.sendMessage(user.chatId, text);
    } catch (err) {
      console.error("Failed to send message to", user.chatId, err.message);
    }
  }
};

module.exports = { bot, sendTelegramNotification };
