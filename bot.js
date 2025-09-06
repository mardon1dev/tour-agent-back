const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const TelegramUser = require("./models/TelegramUsers");
const Place = require("./models/Places");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// ========== /start → subscribe + show bottom menu ==========
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
      `Hello ${
        firstName || ""
      }! 👋\nWelcome to Tour Agency.\nChoose an option below:`,
      {
        reply_markup: {
          keyboard: [
            ["🏝 Places", "👤 My Profile"],
            ["📞 Contacts", "🌐 Visit Website"],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      }
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Failed to subscribe. Please try again later.");
  }
});

// ========== Main Menu buttons ==========
const PAGE_SIZE = 5;

bot.on("message", async (msg) => {
  const chatId = msg.chat.id.toString();
  const text = msg.text;

  // find user
  const user = await TelegramUser.findOne({ chatId });

  if (text === "🏝 Places") {
    if (!user) {
      // not subscribed yet
      return bot.sendMessage(
        chatId,
        "⚠️ You are not subscribed.\nPlease type /start first to subscribe and get access to places."
      );
    }
    await sendPlacesPage(chatId, 1);
  }

  if (text === "👤 My Profile") {
    const user = await TelegramUser.findOne({ chatId });
    bot.sendMessage(
      chatId,
      `👤 Your profile:\nUsername: ${user?.username || "-"}\nName: ${
        user?.firstName || ""
      } ${user?.lastName || ""}`
    );
  }

  if (text === "📞 Contacts") {
    bot.sendMessage(
      chatId,
      "📞 Tour Agency contacts:\nPhone: +998 XX XXX XX XX"
    );
  }

  if (text === "🌐 Visit Website") {
    bot.sendMessage(chatId, "https://yourwebsite.com");
  }

  if (text === "⬅️ Back") {
    bot.sendMessage(chatId, "Back to main menu:", {
      reply_markup: {
        keyboard: [
          ["🏝 Places", "👤 My Profile"],
          ["📞 Contacts", "🌐 Visit Website"],
        ],
        resize_keyboard: true,
      },
    });
  }
});

// ========== Handle callback queries ==========
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id.toString();
  const data = query.data;

  // back to places page 1
  if (data === "back_to_places") {
    await sendPlacesPage(chatId, 1);
    return bot.answerCallbackQuery(query.id);
  }

  // next/prev pages
  if (data.startsWith("places_page_")) {
    const page = parseInt(data.replace("places_page_", ""), 10);
    await sendPlacesPage(chatId, page);
    return bot.answerCallbackQuery(query.id);
  }

  // individual place
  if (data.startsWith("place_")) {
    const placeId = data.replace("place_", "");
    const place = await Place.findById(placeId);

    // check subscription
    const user = await TelegramUser.findOne({ chatId });
    if (!user) {
      return bot.sendMessage(
        chatId,
        "⚠️ You are not subscribed.\nType /start to subscribe."
      );
    }

    if (!place) {
      bot.answerCallbackQuery(query.id, { text: "Place not found" });
      return;
    }

    let msgText = `🏝 *${place.name}*\n\n`;
    msgText += `📍 Location: ${place.location}\n`;
    if (place.description) msgText += `📝 ${place.description}\n`;
    msgText += `Available: ${place.is_available ? "✅ Yes" : "❌ No"}`;

    const inline_keyboard = [];

    if (place.link) {
      inline_keyboard.push([
        {
          text: "🌐 Open Link",
          url: place.link,
        },
      ]);
    }

    inline_keyboard.push([
      {
        text: "⬅️ Back to Places",
        callback_data: "back_to_places",
      },
    ]);

    bot.sendMessage(chatId, msgText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard,
      },
    });

    return bot.answerCallbackQuery(query.id);
  }

  bot.answerCallbackQuery(query.id);
});

// ========== Commands ==========
bot.setMyCommands([
  { command: "/start", description: "Start the bot / Main menu" },
  { command: "/help", description: "Get help on how to use the bot" },
  { command: "/settings", description: "Adjust your preferences" },
  { command: "/logout", description: "Unsubscribe from notifications" },
]);

// /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤝 *Help Menu*\n\n` +
      `Use the buttons below or commands:\n` +
      `• /start – Main menu\n` +
      `• /help – This help message\n` +
      `• /settings – Change your settings\n` +
      `• /logout – Unsubscribe`,
    { parse_mode: "Markdown" }
  );
});

// /settings
bot.onText(/\/settings/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "⚙️ Settings are not implemented yet. (You can add your options here.)"
  );
});

// /logout (unsubscribe)
bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id.toString();
  try {
    await TelegramUser.findOneAndDelete({ chatId });
    bot.sendMessage(
      chatId,
      "❌ You’ve been unsubscribed from notifications.\nType /start anytime to subscribe again."
    );
  } catch (err) {
    bot.sendMessage(chatId, "⚠️ Failed to log you out.");
  }
});

// ========== Helper to send a page of places ==========
async function sendPlacesPage(chatId, page) {
  const skip = (page - 1) * PAGE_SIZE;
  const total = await Place.countDocuments({ is_available: true });
  const places = await Place.find({ is_available: true })
    .skip(skip)
    .limit(PAGE_SIZE);

  if (!places.length) {
    return bot.sendMessage(chatId, "No places available.");
  }

  const inlineKeyboard = places.map((place) => [
    {
      text: place.name,
      callback_data: `place_${place._id}`,
    },
  ]);

  // pagination buttons
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const navRow = [];
  if (page > 1) {
    navRow.push({
      text: "⬅️ Previous",
      callback_data: `places_page_${page - 1}`,
    });
  }
  if (page < totalPages) {
    navRow.push({
      text: "Next ➡️",
      callback_data: `places_page_${page + 1}`,
    });
  }
  if (navRow.length) inlineKeyboard.push(navRow);

  bot.sendMessage(chatId, `Available places (page ${page}/${totalPages}):`, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

module.exports = { bot };
