const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  name: String,
  firstName: String,
  address: String,
  zip: Number,
  city: String,
  activity: String,
  siret: Number,
  customers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  ],
  //planning infos
  avatar: Object,
  subscription: String,
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
