const mongoose = require("mongoose");

const Subscription = mongoose.model("Subscription", {
  title: String,
  date: Date,
  sessionNumber: Number,
  sessionPrice: Number,
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
});

module.exports = Subscription;
