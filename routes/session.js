const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Subscription = require("../models/Subscription");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { refreshTokenIfNeeded } = require("../middlewares/auth");
const User = require("../models/User");
const { google } = require("googleapis");

// \\ // \\ // \\ USER DISPLAY // \\ // \\ // \\

// ========== CREATE ==========
router.post("/session/add", isAuthenticated, async (req, res) => {
  try {
    const { title, start, end, state, content, price, program, customer } =
      req.body;

    // =====================
    // LOGIQUE ABONNEMENT
    // =====================

    let subscription = false;

    const filter = {
      statut: true,
      coach: req.user._id,
      customer: customer,
      isPaid: true,
    };
    const customerSubscription = await Subscription.findOne(filter);
    if (customerSubscription) {
      subscription = true;
      customerSubscription.sessionUsed++;
      if (
        customerSubscription.sessionInitial -
          customerSubscription.sessionUsed ==
        0
      ) {
        customerSubscription.statut = false;
      }
      await customerSubscription.save();
    }

    // =====================
    // CRÉATION SESSION DB
    // =====================

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
      subscription: subscription,
    });
    await newSession.save();

    // =====================
    // GOOGLE CALENDAR
    // =====================

    const coach = await User.findById(req.user.id);

    // Si le coach a connecté Google
    if (coach?.oauth?.accessToken) {
      try {
        const oauth2Client = await refreshTokenIfNeeded(coach);

        const calendar = google.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        const googleEvent = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: title || "Session de coaching",
            description: content || "Session créée depuis l'application",
            start: {
              dateTime: new Date(start).toISOString(),
              timeZone: "Europe/Paris",
            },
            end: {
              dateTime: new Date(end).toISOString(),
              timeZone: "Europe/Paris",
            },
          },
        });

        // Sauvegarde du lien Google
        newSession.googleEventId = googleEvent.data.id;
        await newSession.save();
      } catch (googleError) {
        // ⚠️ On ne bloque PAS la création de session
        console.error(
          "❌ Erreur Google Calendar (session créée quand même):",
          googleError.message
        );
      }
    }

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
    console.log("coucou");
    const { title, start, end, state, content, price, program } = req.body;

    // const sessionToModify = await Session.findByIdAndUpdate(
    //   req.params.id,
    //   {
    //     title: title,
    //     start: start,
    //     end: end,
    //     state: state,
    //     content: content,
    //     price: price,
    //     program: program,
    //   },
    //   { new: true }
    // );

    const session = await Session.findById(req.params.id).populate("customer");

    console.log("session=", session);

    if (!session) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    // =====================
    // UPDATE GOOGLE
    // =====================
    const coach = await User.findById(session.coach);

    if (coach?.oauth?.accessToken && session.googleEventId) {
      try {
        const oauth2Client = await refreshTokenIfNeeded(coach);

        const calendar = google.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        await calendar.events.patch({
          calendarId: "primary",
          eventId: session.googleEventId,
          requestBody: {
            summary: title || session.title,
            description: content || session.content,
            start: {
              dateTime: new Date(start || session.start).toISOString(),
              timeZone: "Europe/Paris",
            },
            end: {
              dateTime: new Date(end || session.end).toISOString(),
              timeZone: "Europe/Paris",
            },
          },
        });
      } catch (googleError) {
        console.error("❌ Erreur Google update:", googleError.message);
      }
    }

    // =====================
    // UPDATE DB
    // =====================
    session.title = title ?? session.title;
    session.start = start ?? session.start;
    session.end = end ?? session.end;
    session.state = state ?? session.state;
    session.content = content ?? session.content;
    session.price = price ?? session.price;
    session.program = program ?? session.program;

    await session.save();

    res.status(201).json({ message: "Session modifiée!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DELETE SESSION ==========
router.delete("/session/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const sessionToDelete = await Session.findByIdAndDelete(req.params.id);

    if (!sessionToDelete) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    // =====================
    // DELETE GOOGLE
    // =====================

    const coach = await User.findById(sessionToDelete.coach);

    if (coach?.oauth?.accessToken && sessionToDelete.googleEventId) {
      try {
        const oauth2Client = await refreshTokenIfNeeded(coach);

        const calendar = google.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        await calendar.events.delete({
          calendarId: "primary",
          eventId: sessionToDelete.googleEventId,
        });
      } catch (googleError) {
        console.error("❌ Erreur Google delete:", googleError.message);
      }
    }

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
    try {
      const filter = {
        customer: req.params.id,
        state: "Confirmée",
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
