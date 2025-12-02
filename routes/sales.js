const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Session = require("../models/Session");

// ========== MONTH SALES ==========
router.get("/sales/month", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Day 0 of current month return the last day of the previous month
    const endOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    const month = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          start: { $gte: startOfMonth },
          end: { $lte: now },
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
    const monthSales = month[0]?.monthSales || 0;

    const prevMonth = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          start: { $gte: startOfPrevMonth },
          end: { $lte: endOfPrevMonth },
          state: "Payée",
        },
      },
      {
        $group: {
          _id: null,
          prevMonthSales: { $sum: "$price" },
        },
      },
    ]);
    const prevMonthSales = prevMonth[0]?.prevMonthSales || 0;

    let diffPrevMonth;
    if (prevMonthSales === 0) {
      diffPrevMonth = monthSales === 0 ? 0 : 100;
    } else {
      diffPrevMonth = ((monthSales - prevMonthSales) / prevMonthSales) * 100;
    }

    diffPrevMonth = Math.round(diffPrevMonth * 100) / 100;

    res.status(200).json({ monthSales, diffPrevMonth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== YEAR SALES ==========
router.get("/sales/year", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);
    //12=month after december because january is 0, day 0 = day before the month => Last day of the year
    const endOfPrevYear = new Date(now.getFullYear() - 1, 12, 0, 23, 59, 59);

    const year = await Session.aggregate([
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
    const yearSales = year[0]?.yearSales || 0;

    const prevYear = await Session.aggregate([
      {
        $match: {
          coach: req.user._id,
          start: { $gte: startOfPrevYear },
          end: { $lt: endOfPrevYear },
          state: "Payée",
        },
      },
      {
        $group: {
          _id: null,
          prevYearSales: { $sum: "$price" },
        },
      },
    ]);
    const prevYearSales = prevYear[0]?.prevYearSales || 0;

    let diffPrevYear;
    if (prevYearSales === 0) {
      diffPrevYear = yearSales === 0 ? 0 : 100;
    } else {
      diffPrevYear = ((yearSales - prevYearSales) / prevYearSales) * 100;
    }

    diffPrevYear = Math.round(diffPrevYear * 100) / 100;

    res.status(200).json({ yearSales, diffPrevYear });
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
          state: { $in: ["Confirmée", "À payer"] },
        },
      },
      {
        $group: {
          _id: null,
          upcomingSales: { $sum: "$price" },
          paymentToCome: { $sum: 1 },
        },
      },
    ]);
    const upcomingSales = result[0]?.upcomingSales || 0;
    const paymentsToCome = result[0]?.paymentToCome || 0;

    res.status(200).json({ upcomingSales, paymentsToCome });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DATA 4 LAST MONTHS ==========
router.get("/sales/graph", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const months = [];

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const startOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const endOfMonth = (date) => {
      return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    };

    const result = await Session.aggregate([
      {
        $match: {
          start: {
            $gte: startOfMonth(months[0]),
            $lte: endOfMonth(months[3]),
          },
          coach: req.user._id,
          state: "Payée",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$start" },
            month: { $month: "$start" },
          },
          total: { $sum: "$price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const chartData = months.map((monthDate) => {
      const found = result.find(
        (item) =>
          item._id.year === monthDate.getFullYear() &&
          item._id.month === monthDate.getMonth() + 1
      );

      return {
        month: `${monthDate.toLocaleString("fr-FR", {
          month: "short",
        })} ${monthDate.getFullYear().toString().slice(-2)}`,
        revenue: found ? found.total : 0,
      };
    });

    console.log("chartData", chartData);

    res.status(200).json({ chartData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
