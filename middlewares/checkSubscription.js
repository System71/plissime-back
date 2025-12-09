const User = require("../models/User");

const checkSubscription = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");

      const user = await User.findOne({
        token: token,
        "subscription.status": "active",
      });
      if (user) {
        req.user = user;
        return next();
      }

      return res.status(401).json({ error: "Unauthorized" });
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = checkSubscription;
