const express = require("express");
const router = express.Router();
const TelegramUser = require("../models/TelegramUsers");
const { sendTelegramNotification } = require("../bot");

// ✅ Add a subscriber manually (optional)
// (though normally users subscribe via /start in Telegram)
router.post("/subscribe", async (req, res) => {
  try {
    const { chatId, username, firstName, lastName } = req.body;

    const user = await TelegramUser.findOneAndUpdate(
      { chatId },
      { username, firstName, lastName },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all subscribers
router.get("/subscribers", async (req, res) => {
  try {
    const users = await TelegramUser.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Send a notification to all subscribers
router.post("/notify", async (req, res) => {
  try {
    const { message } = req.body;
    await sendTelegramNotification(message);
    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
