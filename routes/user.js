const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Customer = require("../models/Customer");
const fileUpload = require("express-fileupload");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
// const convertToBase64 = require("../utils/converToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");
const checkSubscription = require("../middlewares/checkSubscription");

// ========== SIGNUP NEW ==========
router.post("/user/signup/new", async (req, res) => {
  try {
    const password = req.body.password;

    const { email, signupStep } = req.body;

    //Verification if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    //Verification if email doesn't exist
    const userToSearch = await User.findOne({ email: email });
    if (userToSearch && userToSearch.signupStep != 2) {
      const salt = userToSearch.salt;
      const hash = SHA256(password + salt).toString(encBase64);
      const userHash = userToSearch.hash;

      if (hash !== userHash) {
        return res.status(401).json({
          message:
            "Inscription non terminée avec cet email. Veuillez saisir le mot de passe utilisé initialement pour finir votre inscription.",
        });
      }
      res.status(200).json({
        userToSearch: userToSearch,
        message:
          "Nous sommes heureux de vous revoir. Vous pouvez désormais finaliser votre inscription!",
      });
    } else if (!userToSearch) {
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);
      const newUser = new User({
        isActive: false,
        signupStep: signupStep,
        email: email,
        token: token,
        hash: hash,
        salt: salt,
      });

      await newUser.save();

      res.status(200).json({ newUser: newUser });
    } else {
      return res.status(401).json({
        message: "Vous êtes déjà inscrit avec ces mêmes identifiants.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== SIGNUP FINISH ==========
router.put("/user/signup/finish", async (req, res) => {
  try {
    const {
      name,
      firstName,
      address,
      zip,
      city,
      phone,
      activity,
      siret,
      certification,
      token,
      signupStep,
    } = req.body;

    const userToModify = await User.findOneAndUpdate(
      { token: token },
      {
        isActive: true,
        signupStep: signupStep,
        name: name,
        firstName: firstName,
        address: address,
        zip: zip,
        city: city,
        phone: phone,
        activity: activity,
        siret: siret,
        certification: certification,
      },
      { new: true },
    );
    res.status(201).json({ message: "User complété" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== LOGIN ==========
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userToSearch = await User.findOne({ email: email });

    if (!userToSearch) {
      return res.status(401).json({ message: "Email or password invalid" });
    }

    const salt = userToSearch.salt;
    const hash = SHA256(password + salt).toString(encBase64);
    const userHash = userToSearch.hash;

    if (hash !== userHash) {
      return res.status(401).json({ message: "Email or password invalid" });
    }

    if (userToSearch.signupStep != 2) {
      return res.status(401).json({ message: "Inscription non terminée" });
    }

    res.status(200).json({
      _id: userToSearch.id,
      token: userToSearch.token,
      email: userToSearch.email,
      sub: userToSearch.subscription.status,
      firstName: userToSearch.firstName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ON BOARDING STRIPE ==========
router.get("/user/stripe-onboarding/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || !user.stripe_id) {
      return res
        .status(404)
        .json({ message: "Utilisateur ou compte Stripe non trouvé" });
    }

    const accountLink = await stripe.accountLinks.create({
      account: user.stripe_id,
      // Voir pour faire les pages d'atterissage de Stripe
      // refresh_url: `${process.env.FRONTEND_URL}/onboarding-failed`,
      // return_url: `${process.env.FRONTEND_URL}/onboarding-success`,
      refresh_url: `${process.env.FRONTEND_URL}`,
      return_url: `${process.env.FRONTEND_URL}`,
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Erreur d'onboarding Stripe:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== DISPLAY USER INFORMATIONS ==========
router.get("/user/informations", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== MODIFY USER INFORMATIONS ==========
router.put("/user/informations", isAuthenticated, async (req, res) => {
  try {
    const {
      email,
      name,
      firstName,
      address,
      zip,
      city,
      phone,
      activity,
      siret,
      certification,
      subscription,
    } = req.body;

    const userToModify = await User.findByIdAndUpdate(
      req.user,
      {
        email: email,
        name: name,
        firstName: firstName,
        address: address,
        zip: zip,
        city: city,
        phone: phone,
        activity: activity,
        siret: siret,
        certification: certification,
        subscription: subscription,
      },
      { new: true },
    );
    res.status(201).json({ message: "User modifié!" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== DISPLAY COACH INFORMATIONS ==========
router.get("/mycoachs", isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate(
      "coachs.id",
    );
    console.log("customer=", customer);
    res.status(200).json(customer.coachs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
