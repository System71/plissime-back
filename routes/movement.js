const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Movement = require("../models/Movement");

// ========== GET ALL MOVEMENTS ==========
router.get("/movements", isAuthenticated, async (req, res) => {
  try {
    const movements = await Movement.find();
    res.status(201).json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== CREATE MOVEMENT ==========
router.post("/movement/add", isAuthenticated, async (req, res) => {
  try {
    const { title, imageUrl } = req.body;

    const newMovement = new Movement({
      title: title,
      imageurl: imageUrl,
    });

    res.status(201).json(newMovement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
