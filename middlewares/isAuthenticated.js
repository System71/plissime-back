const User = require("../models/User");
const Customer = require("../models/Customer");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      console.log("token=", token);

      const user = await User.findOne({ token });
      if (user) {
        req.user = user;
        return next();
      }

      const customer = await Customer.findOne({ token });
      if (customer) {
        req.customer = customer;
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

module.exports = isAuthenticated;
