const mongoose = require("mongoose");

const Notification = mongoose.model("Notification", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "role",
  },
  role: { type: String, enum: ["User", "Customer"], required: true },
  type: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

module.exports = Notification;
