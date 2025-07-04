const mongoose = require("mongoose");

const Session = mongoose.model("Session", {
  title: String,
  start: Date,
  end: Date,
  state: {
    type: String,
    enum: ["Confirmée", "Annulée", "À payer", "Payée"],
  },
  content: String,
  price: Number,
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
  },
  sessionType: {
    type: mongoose.Schema.Types.ObjectId,
  },
  report: Object,
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
});

module.exports = Session;
