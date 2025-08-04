const mongoose = require("mongoose");

const Customer = mongoose.model("Customer", {
  isActive: { type: Boolean, default: false },
  email: String,
  name: String,
  firstName: String,
  address: String,
  zip: String,
  city: String,
  phone: String,
  birthday: Date,
  activity: String,
  weight: Number,
  size: Number,
  workingTime: String,
  availibility: String,
  sportBackground: String,
  healthProblem: String,
  goals: String,
  coachs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  //planning infos
  avatar: Object,
  token: String,
  hash: String,
  salt: String,
  //
});

module.exports = Customer;
