const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();

// ========== CREATE EXERCISE ==========
router.post("/exercise/add", isAuthenticated, async (req, res) => {
  try {
    const { category, series, repetitions, weight, duration, restTime, notes } =
      req.body;

    const newProgram = new Program({
      category: category,
      series: series,
      repetitions: repetitions,
      weight: weight,
      duration: duration,
      restTime: restTime,
      notes: notes,
    });

    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
