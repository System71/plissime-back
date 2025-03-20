const mongoose = require("mongoose");

const Customer = mongoose.model("Customer", {
  isActive: { type: Boolean, default: false },
  email: String,
  name: String,
  firstName: String,
  address: String,
  zip: Number,
  city: String,
  phone: Number,
  birthday: Date,
  occupation: String,
  activity: String,
  weight: Number,
  size: Number,
  workingTime: Number,
  availibility: Number,
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
});

module.exports = Customer;
