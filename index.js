require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const customerRoutes = require("./routes/customer");
const sessionRoutes = require("./routes/session");
const calendarRoutes = require("./routes/calendar");
const dashboardRoutes = require("./routes/sales");
const programRoutes = require("./routes/program");
const cookieParser = require("cookie-parser");

mongoose.connect(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(userRoutes);
app.use(customerRoutes);
app.use(calendarRoutes);
app.use(sessionRoutes);
app.use(dashboardRoutes);
app.use(programRoutes);

app.get("/", (req, res) => {
  res.status(400).send("coucou");
});

app.all("*", (req, res) => {
  res.status(404).send("Page introuvable");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
