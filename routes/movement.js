const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Movement = require("../models/Movement");

// ========== CREATE CATEGORY ==========
router.post("/movement/add", isAuthenticated, async (req, res) => {
  try {
    const { title, imageUrl } = req.body;

    const newCategory = new Movement({
      title: title,
      imageurl: imageUrl,
    });

    res.status(201).json(newMovement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
