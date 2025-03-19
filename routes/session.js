const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const isAuthenticated = require("../middlewares/isAuthenticated");

// ========== CREATE ==========
router.post("/user/session/new", isAuthenticated, async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
