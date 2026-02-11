const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  SCOPES,
  createOAuthClient,
  refreshTokenIfNeeded,
} = require("../middlewares/auth");
const { google } = require("googleapis");
const Session = require("../models/Session");
const checkSubscription = require("../middlewares/checkSubscription");

// Route pour rediriger l'utilisateur vers Google
router.get("/auth/google/init", checkSubscription, async (req, res) => {
  const userId = req.user._id;
  const oauth2Client = createOAuthClient();

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
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 🔥 Récupération du compte Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.v2.me.get();

    await User.findByIdAndUpdate(state, {
      oauth: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        email: data.email,
      },
    });
    res.redirect(process.env.FRONTEND_URL + "planning"); // redirige vers le front
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion Google" });
  }
});

router.get("/events", checkSubscription, async (req, res) => {
  const coach = await User.findById(req.user);

  if (!coach || !coach.oauth.accessToken) {
    return res.status(400).json({ message: "Compte Google non lié" });
  }

  // 👉 IMPORTANT : On sécurise le token avant tout appel Google
  const oauth2Client = await refreshTokenIfNeeded(coach);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Récupérer les sessions internes de ta DB
    const localEvents = await Session.find({ coach: req.user }).populate(
      "customer",
    );

    const formattedLocalEvents = localEvents.map((session) => ({
      id: session._id,
      title: session.customer.name,
      start: session.start,
      end: session.end,
      backgroundColor: "#34A853",
      borderColor: "#34A853",
      source: "local",
    }));

    const googleLinkedIds = new Set(
      localEvents
        .filter((session) => session.googleEventId)
        .map((session) => session.googleEventId),
    );

    // 2. Récupérer événements Google Calendar
    const googleEvents = await calendar.events.list({
      calendarId: "primary",
      timeMin: sixMonthsAgo.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const formattedGoogleEvents = googleEvents.data.items
      .filter((event) => !googleLinkedIds.has(event.id)) // 🔥 filtre anti-doublon
      .map((event) => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        backgroundColor: "#4285F4",
        borderColor: "#4285F4",
        source: "google",
      }));

    // 3. Fusionner les deux
    const allEvents = [...formattedGoogleEvents, ...formattedLocalEvents];

    // console.log("sessions = ", allEvents);

    res.json(allEvents);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des événements" });
  }
});

router.get("/status", checkSubscription, async (req, res) => {
  const coach = await User.findById(req.user);

  if (!coach) {
    return res
      .status(404)
      .json({ linked: false, message: "Coach introuvable" });
  }

  if (coach.oauth.accessToken) {
    return res.json({ linked: true, email: coach.oauth.email });
  } else {
    return res.json({ linked: false });
  }
});
module.exports = router;
