const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Session = require("../models/Session");

// ========== MONTH SALES ==========
router.get("/sales/month", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          start: { $gte: startOfMonth },
          end: { $lt: now },
          state: "Payée",
        },
      },
      {
        $group: {
          _id: null,
          monthSales: { $sum: "$price" },
        },
      },
    ]);
    const monthSales = result[0]?.monthSales || 0;
    res.status(200).json(monthSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== YEAR SALES ==========
router.get("/sales/year", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    console.log("now=", now);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    console.log("startofYear=", startOfYear);

    const result = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          start: { $gte: startOfYear },
          end: { $lt: now },
          state: "Payée",
        },
      },
      {
        $group: {
          _id: null,
          yearSales: { $sum: "$price" },
        },
      },
    ]);
    const yearSales = result[0]?.yearSales || 0;
    res.status(200).json(yearSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== UPCOMING SALES ==========
router.get("/sales/upcoming", isAuthenticated, async (req, res) => {
  try {
    const result = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          state: "Confirmée",
        },
      },
      {
        $group: {
          _id: null,
          upcomingSales: { $sum: "$price" },
        },
      },
    ]);
    const upcomingSales = result[0]?.upcomingSales || 0;
    res.status(200).json(upcomingSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
