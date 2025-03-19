const mongoose = require("mongoose");

const Session = mongoose.model("Session", {
  title: String,
  start: Date,
  end: Date,
  state: String,
  content: String,
  price: Number,
  project: String,
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
