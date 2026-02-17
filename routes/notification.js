const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const isAuthenticated = require("../middlewares/isAuthenticated");

// ========== DISPLAY NON READ NOTIFICATIONS ==========
router.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const filter = { user: req.user._id, read: false };

    let notifications = await Notification.find(filter).sort({
      createdAt: 1,
    });

    console.log(notifications);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MARKED READ ==========
router.put("/notification/read/:id", isAuthenticated, async (req, res) => {
  try {
    const notificationToModify = await Notification.findById(req.params.id);

    notificationToModify.read = true;

    await notificationToModify.save();

    res.status(200).json({ message: "Notification read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
