const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const isAuthenticated = require("../middlewares/isAuthenticated");

// ========== CREATE ==========
router.post("/session/add", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, project } = req.body;

    const newSession = new Session({
      title: title,
      start: start,
      end: end,
      state: state,
      content: content,
      price: price,
      project: project,
      coach: req.user,
    });

    await newSession.save();

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY SESSIONS ==========
router.get("/sessions", isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({ coach: req.user });
    res.status(201).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MODIFY SESSION ==========
router.put("/session/modify/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, project } = req.body;

    const sessionToModify = await Session.findByIdAndUpdate(
      req.body.id,
      {
        title: title,
        start: start,
        end: end,
        state: state,
        content: content,
        price: price,
        project: project,
      },
      { new: true }
    );

    res.status(201).json({ message: "Session modifiée!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DELETE SESSION ==========
router.delete("/session/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const sessionToDelete = await Session.findByIdAndDelete(req.params.id);
    res.status(201).json("Session supprimée!");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
