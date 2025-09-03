const express = require("express");
const Place = require("../models/Places");
const router = express.Router();

// Add new place
router.post("/", async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    res.json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get available places only
router.get("/", async (req, res) => {
  try {
    const places = await Place.find({ is_available: true });
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) Get all places (no filter)
router.get("/all", async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single place by ID
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update place by ID
router.put("/:id", async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // return updated doc
    );
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete place by ID
router.delete("/:id", async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json({ message: "Place deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
