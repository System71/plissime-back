require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

//Routes
const userRoutes = require("./routes/user");
const customerRoutes = require("./routes/customer");
const sessionRoutes = require("./routes/session");
const calendarRoutes = require("./routes/calendar");
const dashboardRoutes = require("./routes/sales");
const programRoutes = require("./routes/program");
const movementRoutes = require("./routes/movement");
const stripeRoutes = require("./routes/stripe");
const stripeWebhooks = require("./routes/stripeWebhooks");
const isAuthenticated = require("./middlewares/isAuthenticated");

//Stripe WEBHOOKS
app.use(stripeWebhooks);

//Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

app.use(stripeRoutes);
app.use(userRoutes);
app.use(customerRoutes);
app.use(calendarRoutes);
app.use(sessionRoutes);
app.use(dashboardRoutes);
app.use(programRoutes);
app.use(movementRoutes);

app.get("/", (req, res) => {
  res.status(400).send("coucou");
});

app.get("/informations", isAuthenticated, async (req, res) => {
  try {
    if (req.user) {
      const sub = req.user.subscription.status;
      const firstName = req.user.firstName;
      res.status(200).json({ sub, firstName });
    } else if (req.customer) {
      const firstName = req.user.firstName;
      res.status(200).json({ firstName });
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).send("Erreur d'authentification !");
  }
});

app.all("*", (req, res) => {
  res.status(404).send("Page introuvable");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
