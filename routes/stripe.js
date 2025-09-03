const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

// Route Express pour créer un compte connecté Stripe
router.post("/create-connected-account", isAuthenticated, async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Générer un lien pour que le coach configure son compte
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: process.env.FRONTEND_URL, //A MODIFIER ENSUITE!
      return_url: process.env.FRONTEND_URL,
      type: "account_onboarding",
    });

    User.updateOne(
      { _id: req.user._id },
      { stripe_id: account.id },
      { new: true }
    );

    // Stocker l’account.id dans MongoDB lié au coach
    // Coach.updateOne({ _id: coachId }, { stripeAccountId: account.id })

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création compte Stripe" });
  }
});

module.exports = router;
