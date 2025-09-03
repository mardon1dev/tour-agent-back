const express = require("express");
const Stay = require("../models/Stays");
const router = express.Router();

// Add stay record
router.post("/", async (req, res) => {
  try {
    const stay = new Stay(req.body);
    await stay.save();
    res.json(stay);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get stays for a user
router.get("/:userId", async (req, res) => {
  const stays = await Stay.find({ user_id: req.params.userId }).populate(
    "place_id"
  );
  res.json(stays);
});

module.exports = router;
