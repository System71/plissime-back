const mongoose = require("mongoose");

const Exercise = mongoose.model("Exercise", {
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  imageUrl: String,
  series: Number,
  repetitions: Number,
  weight: Number,
  duration: Number,
  restTime: Number,
  notes: String,
});

module.exports = Exercise;
