const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ajoute cette clé dans ton `.env`
const Session = require("../models/Session");
const User = require("../models/User");

// SURVEILLANCE DES PAIEMENTS RECUS
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const endpointSecret = process.env.ENDPOINTSECRET;
    // console.log("🔥 WEBHOOK HIT");
    // console.log("Length du buffer:", request.body.length);
    // console.log("Preview:", request.body.toString("utf8", 0, 200));
    // console.log("Headers reçus:", request.headers);
    // console.log("Secret brute:", JSON.stringify(endpointSecret));
    let event = request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers["stripe-signature"];
      console.log("Signature header:", signature);

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret,
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const amount = paymentIntent.amount;
        const sessionId = paymentIntent.metadata.sessionId;
        try {
          const sessionToModify = await Session.findByIdAndUpdate(
            sessionId,
            {
              state: "Payée",
            },
            { new: true },
          );
          console.log("session modifiée");
          response.status(201).json({ message: "Session modifiée!" });
        } catch (error) {
          response.status(500).json({ message: error.message });
        }
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const sub = event.data.object;
        const id = sub.id;
        const status = sub.status;
        const periodStart = sub.items.data[0].current_period_start;
        const periodEnd = sub.items.data[0].current_period_end;
        const coach = sub.metadata.coachId;
        const priceId = sub.plan.id;

        try {
          const coachToModify = await User.findByIdAndUpdate(coach, {
            $set: {
              "subscription.id": id,
              "subscription.status": status,
              "subscription.periodStart": periodStart,
              "subscription.periodEnd": periodEnd,
            },
          });
          response.status(201).json({
            message: "Coach modifiée avec nouvelles informations abonnement",
          });
        } catch (error) {
          console.log("error =", error);
          response.status(500).json({ message: error.message });
        }
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  },
);

module.exports = router;
