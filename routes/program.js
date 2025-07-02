const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();

// ========== CREATE PROGRAM ==========
router.post("/program/add", isAuthenticated, async (req, res) => {
  try {
    const { title, coach, customer, startDate, endDate, notes, sessions } =
      req.body;

    const newProgram = new Program({
      title: title,
      coach: coach,
      customer: customer,
      startDate: startDate,
      endDate: endDate,
      notes: notes,
      sessions: sessions,
    });

    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
