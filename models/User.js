const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  name: String,
  firstName: String,
  address: String,
  zip: String,
  city: String,
  phone: String,
  activity: String,
  siret: String,
  certification: String,
  subscription: {
    category: { type: String, enum: ["basic", "premium"], default: "basic" },
    type: {
      type: String,
      enum: ["monthly", "annual", null],
      default: null,
    },
    lastPayment: Date,
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
  stripe_id: {
    type: String,
    default: null, // utile si tous les coachs ne sont pas encore inscrits à Stripe
  },
  avatar: Object,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
