const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const isAuthenticated = require("../middlewares/isAuthenticated");

// ========== CREATE ==========
router.post("/session/add", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, project, customer } =
      req.body;

    console.log("req.body=", req.body);

    const newSession = new Session({
      title: title,
      start: start,
      end: end,
      state: state,
      content: content,
      price: price,
      project: project,
      coach: req.user.id,
      customer: customer,
    });

    await newSession.save();
    console.log(newSession);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY SESSIONS ==========
router.get("/sessions", isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({ coach: req.user })
      .populate("coach")
      .populate("customer");
    res.status(201).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY DAY SESSIONS ==========
router.get("/daysessions", isAuthenticated, async (req, res) => {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  );
  const tomorrowStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  );
  try {
    const daySessions = await Session.find({
      coach: req.user,
      start: { $gte: todayStart, $lt: tomorrowStart },
    })
      .populate("coach")
      .populate("customer");

    res.status(201).json(daySessions);
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
