const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();

// ========== CREATE CATEGORY ==========
router.post("/category/add", isAuthenticated, async (req, res) => {
  try {
    const { title, imageUrl } = req.body;

    const newCategory = new Category({
      title: title,
      imageurl: imageUrl,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
