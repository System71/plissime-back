require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

app.get("/", (req, res) => {
  res.json({ message: "Hi" });
});

app.get("/hell", (req, res) => {
  res.json({ message: "Hello" });
});

app.all("*", (req, res) => {
  res.status(404).send("Page introuvable");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
