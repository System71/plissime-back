const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const isAuthenticated = require("../middlewares/isAuthenticated");
// const convertToBase64 = require("../utils/converToBase64");
// const sgMail = require("../configuration/mailer_backup.js");
const sendEmail = require("../configuration/mailer");

// ========== DISPLAY COACH ACTIVES CUSTOMERS ==========
router.get("/mycustomers/active", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { "coachs.id": req.user, "coachs.isActive": true };
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    const myCustomers = await Customer.find(filter).sort({ name: 1 });
    res.status(201).json(myCustomers);
  } catch (error) {
    res.status(500).send("Erreur d'authentification !");
  }
});

// ========== DISPLAY COACH INACTIVES CUSTOMERS ==========
router.get("/mycustomers/inactive", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { "coachs.id": req.user, "coachs.isActive": false };
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const myCustomers = await Customer.find(filter).sort({ name: 1 });
    res.status(201).json(myCustomers);
  } catch (error) {
    res.status(500).send("Erreur d'authentification !");
  }
});

// ========== DISPLAY ONE CUSTOMER ==========
router.get("/find/customer/:id", isAuthenticated, async (req, res) => {
  try {
    const customerToFind = await Customer.findById(req.params.id);
    if (!customerToFind) {
      return res.status(404).json({ message: "Customer non trouvé" });
    }
    const coachInfo = customerToFind.coachs.find(
      (coach) => coach.id.toString() === req.user.id.toString()
    );
    res.status(200).json({ customerToFind, coachInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== CHECK IF EMAIL ALREADY EXIST ==========
router.get("/customer/checkmail/:email", isAuthenticated, async (req, res) => {
  try {
    const customerTofind = await Customer.findOne({ email: req.params.email });
    res.status(201).json(customerTofind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY CUSTOMER INFORMATIONS ==========
router.get("/customer/informations", isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== MODIFY CUSTOMER INFORMATIONS BY COACH ==========
router.put("/mycustomer/informations", isAuthenticated, async (req, res) => {
  try {
    const { email, date, isActive, comment } = req.body;

    const customerToModify = await Customer.findOneAndUpdate(
      { email: email, "coachs.id": req.user },
      {
        $set: {
          "coachs.$.date": date,
          "coachs.$.comment": comment,
          "coachs.$.isActive": isActive,
        },
      },
      { new: true }
    );
    res.status(201).json({ message: "Customer modifié!" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== MODIFY CUSTOMER INFORMATIONS ==========
router.put("/customer/informations", isAuthenticated, async (req, res) => {
  try {
    const {
      email,
      name,
      firstName,
      address,
      zip,
      city,
      phone,
      birthday,
      activity,
      weight,
      size,
      workingTime,
      availibility,
      sportBackground,
      healthProblem,
      goals,
    } = req.body;

    const customerToModify = await Customer.findByIdAndUpdate(
      req.customer,
      {
        email: email,
        name: name,
        firstName: firstName,
        address: address,
        zip: zip,
        city: city,
        phone: phone,
        birthday: birthday,
        activity: activity,
        weight: weight,
        size: size,
        workingTime: workingTime,
        availibility: availibility,
        sportBackground: sportBackground,
        healthProblem: healthProblem,
        goals: goals,
      },
      { new: true }
    );
    res.status(201).json({ message: "Customer modifié!" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== ADD EXISTING CUSTOMER TO A COACH ==========
// ATTENTION IL FAUDRA VERIFIER SI LE COACH N'A PAS DEJA CE CLIENT AU CAS OU! (DOUBLE AJOUT)
router.put("/customer/add", isAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;

    const customerToAdd = await Customer.findOne({ email: email });

    customerToAdd.coachs.push({
      id: req.user._id,
      date: new Date(),
      isActive: true,
    });

    await customerToAdd.save();

    res.status(201).json({ message: "Customer ajouté au coach!" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== PRESIGNUP (AVEC ENVOI DU MAIL D'ACTIVATION) ==========
router.post("/customer/presignup", isAuthenticated, async (req, res) => {
  try {
    const token = uid2(16);
    const { email, name, firstName, phone } = req.body;

    //Verification if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    //Verification if email doesn't exist

    const checkMail = await Customer.findOne({ email: email });

    if (checkMail) {
      return res.status(400).json({ message: "Email already used" });
    }

    const newCustomer = new Customer({
      email: email,
      name: name,
      firstName: firstName,
      phone: phone,
      token: token,
      coachs: [{ id: req.user, date: new Date(), isActive: true }],
    });

    await newCustomer.save();

    const finalisationUrl = process.env.FRONTEND_URL + `activation/${token}`;

    sendEmail(email, firstName, finalisationUrl);

    // const msg = {
    //   to: email,
    //   from: "nicolas.rokicki@plissime.fr", // Doit être vérifié dans SendGrid
    //   subject: "Bienvenue sur Plissime - Crée ton espace personnel !",
    //   html: `
    //     <p>Salut ${firstName},</p>
    //     <p>Ton coach vient de te rajouter à notre plateforme Plissime !</p>
    //     <p>Tu peux dès maintenant créer ton espace personnel pour suivre tes entraînements, échanger avec ton coach et suivre tes progrès.</p>
    //     <a href="${finalisationUrl}" style="display:inline-block;background-color:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Finaliser mon inscription</a>
    //     <p>Une fois connecté(e), tu seras automatiquement rattaché(e) à ton coach et tu pourras commencer à profiter de tout ce que la plateforme a à t’offrir.</p>
    //     <p>Si tu rencontres le moindre souci, n’hésite pas à nous écrire.</p>
    //     <p>Bienvenue chez Plissime 💪</p>
    //     <p>A très vite!</p>
    //   `,
    // };

    // await sgMail.send(msg);

    res.status(200).json({
      _id: newCustomer.id,
      token: newCustomer.token,
      account: {
        email: newCustomer.email,
        // Voir pour confirmé l'avatar
      },
      message: "Un mail d'activation a été envoyé au client.",
    });
  } catch (error) {
    console.log("error=", error);
    res.status(500).json({ message: error.message });
  }
});

// ========== ACTIVATION ==========
router.put("/customer/activation/:token", async (req, res) => {
  try {
    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);

    const {
      email,
      name,
      firstName,
      address,
      zip,
      city,
      phone,
      birthday,
      occupation,
      activity,
      weight,
      size,
      workingTime,
      availibility,
      sportBackground,
      healthProblem,
      goals,
    } = req.body;

    const customerToFind = await Customer.findOneAndUpdate(
      { token: req.params.token, isActive: false },
      {
        isActive: true,
        email: email,
        name: name,
        firstName: firstName,
        address: address,
        zip: zip,
        city: city,
        phone: phone,
        birthday: birthday,
        occupation: occupation,
        activity: activity,
        weight: weight,
        size: size,
        workingTime: workingTime,
        availibility: availibility,
        sportBackground: sportBackground,
        healthProblem: healthProblem,
        goals: goals,
      },
      { new: true }
    );

    if (!customerToFind) {
      return res.status(409).json({ message: "Ce compte a déjà été activé." });
    }

    res.status(200).json({
      message: "Compte activé avec succés!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== SIGNUP NEW ==========
router.post("/customer/signup/new", async (req, res) => {
  try {
    const password = req.body.password;

    const { email, signupStep } = req.body;

    //Verification if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    //Verification if email doesn't exist
    const customerToSearch = await Customer.findOne({ email: email });
    if (customerToSearch && customerToSearch.signupStep != 1) {
      const salt = customerToSearch.salt;
      const hash = SHA256(password + salt).toString(encBase64);
      const customerHash = customerToSearch.hash;

      if (hash !== customerHash) {
        return res.status(401).json({
          message:
            "Inscription non terminée avec cet email. Veuillez saisir le mot de passe utilisé initialement pour finir votre inscription.",
        });
      }
      res.status(200).json({
        customerToSearch: customerToSearch,
        message:
          "Nous sommes heureux de vous revoir. Vous pouvez désormais finaliser votre inscription!",
      });
    } else if (!customerToSearch) {
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);
      const newCustomer = new Customer({
        signupStep: signupStep,
        email: email,
        token: token,
        hash: hash,
        salt: salt,
      });

      await newCustomer.save();

      res.status(200).json({ newCustomer: newCustomer });
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
router.put("/customer/signup/finish", async (req, res) => {
  try {
    const {
      name,
      firstName,
      address,
      zip,
      city,
      phone,
      activity,
      token,
      signupStep,
    } = req.body;

    const customerToModify = await Customer.findOneAndUpdate(
      { token: token },
      {
        signupStep: signupStep,
        name: name,
        firstName: firstName,
        address: address,
        zip: zip,
        city: city,
        phone: phone,
        activity: activity,
      },
      { new: true }
    );
    res.status(201).json({ message: "Customer complété" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== LOGIN ==========
router.post("/customer/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const customerToSearch = await Customer.findOne({ email: email });

    if (!customerToSearch) {
      return res.status(401).json({ message: "Email or password invalid" });
    }

    const salt = customerToSearch.salt;
    const hash = SHA256(password + salt).toString(encBase64);
    const customerHash = customerToSearch.hash;

    if (hash !== customerHash) {
      return res.status(401).json({ message: "Email or password invalid" });
    }

    res.status(200).json({
      _id: customerToSearch.id,
      token: customerToSearch.token,
      email: customerToSearch.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY NUMBER OF NEW CUSTOMERS ==========
router.get("/mycustomers/new", isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    const month = await Customer.aggregate([
      { $unwind: "$coachs" },
      {
        $match: {
          "coachs.id": req.user._id,
          "coachs.date": { $gte: startOfMonth, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          newCustomersMonth: { $sum: 1 },
        },
      },
    ]);
    const newCustomersMonth = month[0]?.newCustomersMonth || 0;

    const prevMonth = await Customer.aggregate([
      { $unwind: "$coachs" },
      {
        $match: {
          "coachs.id": req.user._id,
          "coachs.date": { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        },
      },
      {
        $group: {
          _id: null,
          newCustomersPrevMonth: { $sum: 1 },
        },
      },
    ]);
    const newCustomersPrevMonth = prevMonth[0]?.newCustomersPrevMonth || 0;

    const diffPrevMonth = newCustomersMonth - newCustomersPrevMonth;

    res.status(200).json({ newCustomersMonth, diffPrevMonth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
