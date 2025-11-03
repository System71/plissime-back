const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const User = require("../models/User");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ajoute cette clé dans ton `.env`

// Route Express pour créer un compte connecté Stripe
router.post("/create-connected-account", isAuthenticated, async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: req.user.email,
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

    console.log("account.id=", account.id);
    console.log("user._id=", req.user._id);

    const updateUser = await User.findByIdAndUpdate(
      req.user._id,
      { stripe_id: account.id },
      { new: true }
    );

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("ERREUR STRIPE =>", error);
    res.status(500).json({ error: "Erreur création compte Stripe" });
  }
});

router.post("/create-payment-intent", isAuthenticated, async (req, res) => {
  try {
    const { coachId, amount, sessionId } = req.body; // amount en centimes (ex: 2000 = 20€)
    // Récupérer le coach depuis la DB pour avoir son stripe_id
    const coach = await User.findById(coachId);
    if (!coach || !coach.stripe_id) {
      return res
        .status(400)
        .json({ error: "Coach introuvable ou non connecté à Stripe." });
    }

    // Créer un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // en centimes
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: coach.stripe_id, // le compte connecté du coach
      },
      description: `Paiement pour coach ${coach.name}`,
      metadata: {
        sessionId: sessionId.toString(), // ⚠️ IMPORTANT : Ajouter sessionId
        coachId: coachId.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur création PaymentIntent:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement." });
  }
});

module.exports = router;
