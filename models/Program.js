const mongoose = require("mongoose");

const Program = mongoose.model("Program", {
  title: String,
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  startDate: Date,
  endDate: Date,
  notes: String,
  sessions: [
    {
      day: Date,
      exercises: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
        },
      ],
    },
  ],
});

module.exports = Program;
