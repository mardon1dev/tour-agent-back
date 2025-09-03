const mongoose = require("mongoose");

const staySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  place_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Place",
    required: true,
  },
  check_in: { type: Date, required: true },
  check_out: { type: Date, required: true },
});

module.exports = mongoose.model("Stay", staySchema);
