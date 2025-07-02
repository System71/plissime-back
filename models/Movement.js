const mongoose = require("mongoose");

const Movement = mongoose.model("Movement", {
  title: String,
  category: {
    type: String,
    enum: [
      "Bras",
      "Abdominaux",
      "Dos/Epaules",
      "Pectoraux",
      "Jambes/Fessier",
      "Cardio",
    ],
  },
  imageUrl: String,
});

module.exports = Movement;
