const mongoose = require("mongoose");

const Subscription = mongoose.model("Subscription", {
  statut: Boolean,
  title: String,
  date: Date,
  sessionUsed: Number,
  sessionInitial: Number,
  sessionPrice: Number,
  totalPrice: Number,
  isPaid: Boolean,
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
