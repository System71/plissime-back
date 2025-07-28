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
      informations: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
      progress: Number,
      start: Date,
      lastUpdate: Date,
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
