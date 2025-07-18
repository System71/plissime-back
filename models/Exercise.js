const mongoose = require("mongoose");

const Exercise = mongoose.model("Exercise", {
  movement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movement",
  },
  series: Number,
  repetitions: Number,
  weight: Number,
  duration: Number,
  restTime: Number,
  notes: String,
});

module.exports = Exercise;
