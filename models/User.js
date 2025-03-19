const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  name: String,
  firstName: String,
  address: String,
  zip: Number,
  city: String,
  phone: Number,
  activity: String,
  siret: Number,
  certification: String,
  customers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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
  subscription: {
    category: String,
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",
      },
    ],
  },
  //planning infos
  oauth: {
    googleId: String,
    accessToken: String,
    refreshToken: String,
    expiryDate: Number,
  },
  avatar: Object,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
