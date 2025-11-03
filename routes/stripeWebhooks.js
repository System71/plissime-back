const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ajoute cette clé dans ton `.env`
const endpointSecret =
  "whsec_32d2e7f1cbbe0331f420e91d3ebf0b4a14791f54aaaa02e2ed81584733acec0f";
const bodyParser = require("body-parser");
const Session = require("../models/Session");

// SURVEILLANCE DES PAIEMENTS RECUS
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response) => {
    let event = request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
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
            { new: true }
          );
          console.log("Session modifiée");
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
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

module.exports = router;
