const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { oauth2Client, SCOPES } = require("../middlewares/auth");
const { google } = require("googleapis");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Session = require("../models/Session");

// Route pour rediriger l'utilisateur vers Google
router.get("/auth/google/init", isAuthenticated, async (req, res) => {
  const userId = req.user._id;

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId.toString(),
  });

  res.json({ url }); // on renvoie l’URL au front
});

// Callback après l'authentification
router.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send("Code d'autorisation manquant !");
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("id=", state);
    await User.findByIdAndUpdate(state, {
      oauth: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
    });
    res.redirect("http://localhost:5173/planning"); // redirige vers le front
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion Google" });
  }
});

router.get("/events", isAuthenticated, async (req, res) => {
  const coach = await User.findById(req.user);

  if (!coach || !coach.oauth.accessToken) {
    return res.status(400).json({ message: "Compte Google non lié" });
  }
  // Configurer OAuth avec les tokens du coach
  oauth2Client.setCredentials({
    access_token: coach.oauth.accessToken,
    refresh_token: coach.oauth.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    // 1. Récupérer événements Google Calendar
    const googleEvents = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const formattedGoogleEvents = googleEvents.data.items.map((event) => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      source: "google",
    }));

    // 2. Récupérer les sessions internes de ta DB
    const localEvents = await Session.find({ coach: req.user });

    console.log("session local = ", localEvents);

    const formattedLocalEvents = localEvents.map((session) => ({
      id: session._id,
      title: session.title,
      start: session.startDate,
      end: session.endDate,
      source: "local",
    }));

    // 3. Fusionner les deux
    const allEvents = [...formattedGoogleEvents, ...formattedLocalEvents];

    console.log("sessions = ", allEvents);

    res.json(allEvents);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des événements" });
  }
});

router.get("/status", isAuthenticated, async (req, res) => {
  const coach = await User.findById(req.user);

  if (!coach) {
    return res
      .status(404)
      .json({ linked: false, message: "Coach introuvable" });
  }

  if (coach.oauth.accessToken) {
    return res.json({ linked: true });
  } else {
    return res.json({ linked: false });
  }
});
module.exports = router;
