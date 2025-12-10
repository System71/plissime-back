const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const User = require("../models/User");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const checkSubscription = require("../middlewares/checkSubscription");
const { format } = require("date-fns");

const translateStatus = (status) => {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "open":
      return "Ouverte";
    case "paid":
      return "Payée";
    case "uncollectible":
      return "Irrécouvrable";
    case "void":
      return "Annulée";
    default:
      return status; // au cas où Stripe ajoute un nouveau statut
  }
};

// Create connected account STRIPE for coachs
router.post("/create-connected-account", isAuthenticated, async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: req.user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Generate link to configure account Stripe for the coach
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: process.env.FRONTEND_URL, //A MODIFIER ENSUITE!
      return_url: process.env.FRONTEND_URL,
      type: "account_onboarding",
    });

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

// Create payment intent
router.post("/create-payment-intent", isAuthenticated, async (req, res) => {
  try {
    const { coachId, amount, sessionId } = req.body; // amount in centimes (ex: 2000 = 20€)

    const coach = await User.findById(coachId);
    if (!coach || !coach.stripe_id) {
      return res
        .status(400)
        .json({ error: "Coach introuvable ou non connecté à Stripe." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in centimes
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: coach.stripe_id, // le compte connecté du coach
      },
      description: `Paiement pour coach ${coach.name}`,
      metadata: {
        sessionId: sessionId.toString(), // ⚠️ IMPORTANT : Add sessionId
        coachId: coachId.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur création PaymentIntent:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement." });
  }
});

// Annual subscription for coachs
router.post(
  "/subscription/checkout/annual",
  isAuthenticated,
  async (req, res) => {
    const priceId = process.env.ANNUAL_SUB;
    const coachId = req.user;

    try {
      const coach = await User.findById(coachId);

      // Create customer account STRIPE for coachs if doesn't exist
      let customerId = coach.subscription.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: coach.email,
          metadata: { coachId: coach._id.toString() },
        });
        customerId = customer.id;
        coach.subscription.stripeCustomerId = customerId;
        await coach.save();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: {
            coachId: coach._id.toString(),
          },
        },
        //voir pour faire des pages adéquates
        success_url: process.env.FRONTEND_URL,
        cancel_url: process.env.FRONTEND_URL,
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Erreur création session:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Mensual subscription for coachs
router.post(
  "/subscription/checkout/mensual",
  isAuthenticated,
  async (req, res) => {
    const priceId = process.env.MENSUAL_SUB;
    const coachId = req.user;

    try {
      const coach = await User.findById(coachId);
      // Create customer account STRIPE for coachs if doesn't exist
      let customerId = coach.subscription.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: coach.email,
          metadata: { coachId: coach._id.toString() },
        });
        customerId = customer.id;
        coach.subscription.stripeCustomerId = customerId;
        await coach.save();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: {
            coachId: coach._id.toString(),
          },
        },
        //voir pour faire des pages adéquates
        success_url: process.env.FRONTEND_URL,
        cancel_url: process.env.FRONTEND_URL,
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Erreur création session:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/stripe/invoices/:stripeId",
  checkSubscription,
  async (req, res) => {
    try {
      const { stripeId } = req.params;

      const invoices = await stripe.invoices.list({ customer: stripeId });

      const formattedInvoices = invoices.data.map((invoice) => ({
        date: format(new Date(invoice.created * 1000), "dd/MM/yyyy"),
        title: invoice.lines.data[0].description,
        status: translateStatus(invoice.status),
        pdf: invoice.invoice_pdf,
      }));

      res.status(201).json(formattedInvoices);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
