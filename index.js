const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const placeRoutes = require("./routes/placeRoutes");
const stayRoutes = require("./routes/stayRoutes");
const sendTelegramNotification = require("./routes/sentNotification");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/stays", stayRoutes);
app.use("/api/sent-notification", sendTelegramNotification);

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
