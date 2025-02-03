const mongoose = require("mongoose");

const Customer = mongoose.model("Customer", {
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
  sessions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
  ],
  program: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    },
  ],
  bills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },
  ],
  //planning infos
  avatar: Object,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
