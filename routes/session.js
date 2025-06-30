const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const isAuthenticated = require("../middlewares/isAuthenticated");

// \\ // \\ // \\ USER DISPLAY // \\ // \\ // \\ 

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

// ========== DISPLAY COACHS SESSIONS ==========
router.get("/sessions", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    console.log("name=", name);
    const filter = { coach: req.user._id, state: { $ne: "Payée" } };

    let sessions = await Session.find(filter)
      .sort({ start: 1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      sessions = sessions.filter((session) =>
        session.customer?.name?.match(regex)
      );
    }

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACHS SESSIONS PAID ==========
router.get("/sessions/paid", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    console.log("name=", name);
    const filter = { coach: req.user._id, state: "Payée" };

    let sessions = await Session.find(filter)
      .sort({ start: -1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      sessions = sessions.filter((session) =>
        session.customer?.name?.match(regex)
      );
    }

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY ONE SESSION ==========
router.get("/session/:id", isAuthenticated, async (req, res) => {
  try {
    const sessionTofind = await Session.findById(req.params.id)
      .populate("coach")
      .populate("customer");
    res.status(201).json(sessionTofind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY DAY SESSIONS ==========
router.get("/sessions/daily", isAuthenticated, async (req, res) => {
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

// ========== DISPLAY USER UPCOMING SESSIONS ==========
router.get("/sessions/user/upcoming", isAuthenticated, async (req, res) => {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  );
  try {
    const upcomingSessions = await Session.find({
      coach: req.user,
      start: { $gte: tomorrow },
    })
      .populate("coach")
      .populate("customer");

    res.status(201).json(upcomingSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MODIFY SESSION ==========
router.put("/session/modify/:id", isAuthenticated, async (req, res) => {
  try {
    console.log("req.params=", req.params);
    const { title, start, end, state, content, price, project } = req.body;

    const sessionToModify = await Session.findByIdAndUpdate(
      req.params.id,
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
    console.log("session modifiée=", sessionToModify);
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

// ========== DISPLAY NEXT CUSTOMER SESSION FOR USER DISPLAY ==========
router.get("/sessions/next/:customerId", isAuthenticated, async (req, res) => {
  const { customerId } = req.params;
  try {
    console.log("next!");
    const now = new Date();

    const nextSession = await Session.findOne({
      customer: customerId,
      coach: req.user,
      start: { $gt: now },
    }).sort({ start: 1 });

    if (!nextSession) {
      return res.status(204).json({ message: "Aucune session à venir" });
    }
    res.status(201).json(nextSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// \\ // \\ // \\ CUSTOMER DISPLAY // \\ // \\ // \\ 

// ========== DISPLAY CUSTOMER UPCOMING SESSIONS ==========
router.get("/sessions/customer/upcoming", isAuthenticated, async (req, res) => {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  );
  try {
    const filter = { customer: req.customer._id, state: "Confirmée",start: { $gte: tomorrow } };

    const upcomingSessions = await Session.find(filter)
      .populate("coach")
      .populate("customer");
    res.status(201).json(upcomingSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY CUSTOMER SESSIONS TO PAID ==========
router.get("/sessions/customer/topaid", isAuthenticated, async (req, res) => {
  try {
    const filter = { customer: req.customer._id, state: "À payer" };

    const sessionsToPaid = await Session.find(filter)
      .sort({ start: -1 })
      .populate("coach")
      .populate("customer");

    res.status(200).json(sessionsToPaid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY CUSTOMER SESSIONS PAID ==========
router.get("/sessions/customer/paid", isAuthenticated, async (req, res) => {
  try {
    const filter = { customer: req.customer._id, state: "Payée" };

    const sessionsPaid = await Session.find(filter)
      .sort({ start: -1 })
      .populate("coach")
      .populate("customer");

    res.status(200).json(sessionsPaid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
