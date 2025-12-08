const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const checkSubscription = require("../middlewares/checkSubscription");

// ========== CREATE EXERCISE ==========
router.post("/exercise/add", checkSubscription, async (req, res) => {
  try {
    const { category, series, repetitions, weight, duration, restTime, notes } =
      req.body;

    const newExercise = new Exercise({
      movement: movement,
      series: series,
      repetitions: repetitions,
      weight: weight,
      duration: duration,
      restTime: restTime,
      notes: notes,
    });

    res.status(201).json(newExercise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
