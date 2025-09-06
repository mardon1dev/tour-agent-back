const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: String,
  is_available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  // 👇 Add image fields
  imageUrl: String, // for one image
  // OR:
  images: [String], // for multiple images
});

module.exports = mongoose.model("Place", placeSchema);
