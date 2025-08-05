const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { oauth2Client, authUrl } = require("../middlewares/auth");
const { google } = require("googleapis");

// Route pour rediriger l'utilisateur vers Google
router.get("/auth/google", async (req, res) => {
  res.redirect(authUrl);
});

// Callback après l'authentification
router.get("/auth/google/callback", async (req, res) => {
  try {
    // This will provide an object with the access_token and refresh_token.
    // Save these somewhere safe so they can be used at a later time.
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send("Authentification réussie !");
  } catch (error) {
    res.status(500).send("Erreur d'authentification !");
  }

  // const { code } = req.query;

  // if (!code) {
  //   return res.status(400).send("Code d'autorisation manquant !");
  // }

  // try {
  //   const { tokens } = await oauth2Client.getToken(code);
  //   oauth2Client.setCredentials(tokens);

  //   // Récupérer l'ID Google de l'utilisateur connecté
  //   const userInfo = await google
  //     .oauth2("v2")
  //     .userinfo.get({ auth: oauth2Client });
  //   const googleId = userInfo.data.id;

  //   // Vérifier si l'utilisateur existe déjà en base
  //   let user = await User.findOne({ googleId });

  //   if (user) {
  //     user.accessToken = tokens.access_token;
  //     user.refreshToken = tokens.refresh_token || user.refreshToken;
  //     user.expiryDate = tokens.expiry_date;
  //   } else {
  //     user = new User({
  //       googleId,
  //       accessToken: tokens.access_token,
  //       refreshToken: tokens.refresh_token,
  //       expiryDate: tokens.expiry_date,
  //     });
  //   }

  //   await user.save(); // Sauvegarde des tokens en base

  //   // Créer un cookie avec l'ID utilisateur
  //   res.cookie("googleId", googleId, { httpOnly: true, secure: true });
});

// Route pour obtenir les événements du calendrier
router.get("/calendar/events", async (req, res) => {
  const googleId = req.cookies.googleId; // Récupération de l'ID Google depuis un cookie sécurisé

  if (!googleId) {
    return res.status(401).send("Utilisateur non authentifié !");
  }

  const user = await User.findOne({ googleId });

  if (!user) {
    return res.status(401).send("Utilisateur introuvable !");
  }

  // Vérifier si l'Access Token est expiré
  if (Date.now() >= user.expiryDate) {
    try {
      const { credentials } = await oauth2Client.refreshToken(
        user.refreshToken
      );
      user.accessToken = credentials.access_token;
      user.expiryDate = credentials.expiry_date;
      await user.save(); // Mise à jour en base
    } catch (error) {
      console.error("Erreur de rafraîchissement :", error);
      return res.status(500).send("Impossible de rafraîchir le token.");
    }
  }

  oauth2Client.setCredentials({ access_token: user.accessToken });

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements :", error);
    res.status(500).send("Erreur API !");
  }
});

module.exports = router;
