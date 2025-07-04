const mongoose = require("mongoose");

const Program = mongoose.model("Program", {
  title: String,
  coach: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  customers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  ],
  duration: Number,
  notes: String,
  sessions: [
    {
      exercises: [
        {
          movement: { type: mongoose.Schema.Types.ObjectId, ref: "Movement" },
          series: Number,
          repetitions: Number,
          weight: Number,
          duration: Number,
          restTime: Number,
          notes: String,
        },
      ],
    },
  ],
});

module.exports = Program;
