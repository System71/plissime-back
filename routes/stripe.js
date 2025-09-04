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

    User.updateOne(
      { _id: req.user._id },
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

// SURVEILLANCE DES PAIEMENTS RECUS

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer l'événement payment_intent.succeeded
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Paiement réussi:", paymentIntent.id);

        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Paiement échoué:", failedPayment.id);

        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  }
);

async function handlePaymentSuccess(paymentIntent) {
  try {
    // Récupérer sessionId depuis les metadata du PaymentIntent
    const { sessionId, coachId } = paymentIntent.metadata;

    if (!sessionId) {
      console.error("SessionId manquant dans les metadata du PaymentIntent");
      return;
    }

    // Mettre à jour le statut de la session
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      {
        status: "paid",
        // paymentDetails: {
        //   paymentIntentId: paymentIntent.id,
        //   amount: paymentIntent.amount,
        //   currency: paymentIntent.currency,
        //   paidAt: new Date(paymentIntent.created * 1000),
        //   transferId: paymentIntent.transfer_data?.destination ? "auto" : null,
        // },
      },
      { new: true }
    );

    if (updatedSession) {
      console.log(`Session ${sessionId} mise à jour: status = paid`);

      // Optionnel : Envoyer des notifications
      await sendPaymentConfirmationEmails(updatedSession, paymentIntent);
    } else {
      console.error(`Session ${sessionId} non trouvée`);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session:", error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const { sessionId } = paymentIntent.metadata;

    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, {
        status: "payment_failed",
        paymentDetails: {
          paymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message,
          failedAt: new Date(),
        },
      });

      console.log(`Session ${sessionId} marquée comme payment_failed`);
    }
  } catch (error) {
    console.error("Erreur lors de la gestion de l'échec de paiement:", error);
  }
}

// Fonction pour envoyer les emails de confirmation (optionnel)
async function sendPaymentConfirmationEmails(session, paymentIntent) {
  try {
    // Email au client
    // await sendEmail(session.clientEmail, 'payment-confirmation', { session, paymentIntent });

    // Email au coach
    // await sendEmail(session.coachEmail, 'booking-confirmation', { session, paymentIntent });

    console.log("Emails de confirmation envoyés");
  } catch (error) {
    console.error("Erreur envoi emails:", error);
  }
}

module.exports = router;
