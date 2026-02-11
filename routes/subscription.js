const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const Subscription = require("../models/Subscription");

// \\ // \\ // \\ USER DISPLAY // \\ // \\ // \\

// ========== CREATE ==========
router.post("/subscription/add", isAuthenticated, async (req, res) => {
  try {
    const { title, sessionInitial, sessionPrice, customer } = req.body;

    const newSubscription = new Subscription({
      statut: true,
      title: title,
      date: new Date(),
      sessionUsed: 0,
      sessionInitial: sessionInitial,
      sessionPrice: sessionPrice,
      totalPrice: sessionInitial * sessionPrice,
      isPaid: false,
      coach: req.user.id,
      customer: customer,
    });

    await newSubscription.save();

    res.status(201).json(newSubscription);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACHS ALL SUBSCRIPTIONS ==========
router.get("/subscriptions", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { coach: req.user._id };

    let subscriptions = await Subscription.find(filter)
      .sort({ start: 1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      subscriptions = subscriptions.filter((sub) =>
        sub.customer?.name?.match(regex),
      );
    }

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACHS ACTIVE SUBSCRIPTIONS ==========
router.get("/subscriptions/active", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { coach: req.user._id, statut: true };

    let subscriptions = await Subscription.find(filter)
      .sort({ start: 1 })
      .populate("coach")
      .populate("customer");

    if (name) {
      const regex = new RegExp(name, "i");
      subscriptions = subscriptions.filter((sub) =>
        sub.customer?.name?.match(regex),
      );
    }

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY ONE SESSION ==========
router.get("/subscription/:id", isAuthenticated, async (req, res) => {
  try {
    const subscriptionToFind = await Subscription.findById(req.params.id)
      .populate("coach")
      .populate("customer");
    res.status(201).json(subscriptionToFind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DELETE SESSION ==========
router.delete("/subscription/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const subscriptionToDelete = await Subscription.findByIdAndDelete(
      req.params.id,
    );
    res.status(201).json("Abonnement supprimée!");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== FIND CUSTOMER ==========
router.get("/subscription/find/:id", isAuthenticated, async (req, res) => {
  try {
    const filter = {
      coach: req.user._id,
      customer: req.params.id,
      statut: true,
    };

    const subscriptionToFind = await Subscription.findOne(filter);

    res.status(201).json(subscriptionToFind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
