const mongoose = require("mongoose");

const Customer = mongoose.model("Customer", {
  isActive: { type: Boolean, default: false },
  signupStep: String,
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
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
      isActive: Boolean,
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
