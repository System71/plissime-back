const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const isAuthenticated = require("../middlewares/isAuthenticated");

// \\ // \\ // \\ USER DISPLAY // \\ // \\ // \\

// ========== CREATE ==========
router.post("/session/add", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, program, customer } =
      req.body;

    const newSession = new Session({
      title: title,
      start: start,
      end: end,
      state: state,
      content: content,
      price: price,
      program: program,
      coach: req.user.id,
      customer: customer,
    });

    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACHS UPCOMING SESSIONS ==========
router.get("/sessions/upcoming", isAuthenticated, async (req, res) => {
  const now = new Date();
  try {
    const { name } = req.query;
    const filter = { coach: req.user._id, start: { $gte: now } };

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

// ========== DISPLAY COACHS PAST SESSIONS ==========
router.get("/sessions/past", isAuthenticated, async (req, res) => {
  const now = new Date();
  try {
    const { name } = req.query;
    const filter = {
      coach: req.user._id,
      start: { $lt: now },
      state: "Confirmée",
    };

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
    const filter = { coach: req.user._id, state: "Payée" };

    let sessionsPaid = await Session.find(filter)
      .sort({ start: -1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      sessionsPaid = sessionsPaid.filter((session) =>
        session.customer?.name?.match(regex)
      );
    }

    res.status(200).json(sessionsPaid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACHS SESSIONS TO PAID ==========
router.get("/sessions/topaid", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { coach: req.user._id, state: "À payer" };

    const sessionsToPaid = await Session.find(filter)
      .sort({ start: -1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      sessionsToPaid = sessionsToPaid.filter((session) =>
        session.customer?.name?.match(regex)
      );
    }
    res.status(200).json(sessionsToPaid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY ONE SESSION ==========
router.get("/session/:id", isAuthenticated, async (req, res) => {
  try {
    const sessionToFind = await Session.findById(req.params.id)
      .populate("coach")
      .populate("customer");
    res.status(201).json(sessionToFind);
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

// ========== DISPLAY USER UPCOMING SESSIONS (EXCEPT TODAY) ==========
router.get("/sessions/user/upcoming", isAuthenticated, async (req, res) => {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  );
  try {
    const { name } = req.query;
    const filter = { coach: req.user._id, start: { $gte: tomorrow } };

    let upcomingSessions = await Session.find(filter)
      .sort({ start: 1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      upcomingSessions = upcomingSessions.filter((session) =>
        session.customer?.name?.match(regex)
      );
    }

    res.status(200).json(upcomingSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MODIFY SESSION ==========
router.put("/session/modify/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, program } = req.body;

    const sessionToModify = await Session.findByIdAndUpdate(
      req.params.id,
      {
        title: title,
        start: start,
        end: end,
        state: state,
        content: content,
        price: price,
        program: program,
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

// ========== DISPLAY NEXT CUSTOMER SESSION FOR USER DISPLAY ==========
router.get("/sessions/next/:customerId", isAuthenticated, async (req, res) => {
  const { customerId } = req.params;
  try {
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
    const filter = {
      customer: req.customer._id,
      state: "Confirmée",
      start: { $gte: tomorrow },
    };

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

// ========== DISPLAY CUSTOMER SESSIONS TO PAID (COACH DIPLAY) ==========
router.get(
  "/sessions/topaid/customer/:id",
  isAuthenticated,
  async (req, res) => {
    try {
      const filter = {
        coach: req.user,
        customer: req.params.id,
        state: "À payer",
      };

      const customerSessions = await Session.find(filter).sort({ start: -1 });

      res.status(200).json(customerSessions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========== DISPLAY CUSTOMER SESSIONS TO PAID (COACH DIPLAY) ==========
router.get(
  "/sessions/upcoming/customer/:id",
  isAuthenticated,
  async (req, res) => {
    const now = new Date();
    // const tomorrow = new Date(
    //   Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    // );
    try {
      const filter = {
        customer: req.params.id,
        state: "Confirmée",
        // start: { $gte: tomorrow },
        start: { $gte: now },
      };

      const upcomingSessions = await Session.find(filter);
      console.log("upcomingSessions=", upcomingSessions);
      res.status(201).json(upcomingSessions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
