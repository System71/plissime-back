const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const isAuthenticated = require("../middlewares/isAuthenticated");
// const convertToBase64 = require("../utils/converToBase64");
const sgMail = require("../configuration/mailer.js");

// ========== DISPLAY COACH CUSTOMERS ==========
router.get("/mycustomers", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { coachs: { $in: [req.user] } };
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
    const customerTofind = await Customer.findById(req.params.id);
    res.status(200).json(customerTofind);
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

// ========== MODIFY CUSTOMER INFORMATIONS ==========
router.put("/customer/informations", isAuthenticated, async (req, res) => {
  try {
    const {
      email,
      password,
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
        password: password,
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

    customerToAdd.coachs.push(req.user._id);

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
      coachs: [req.user],
    });

    await newCustomer.save();

    const finalisationUrl = process.env.FRONTEND_URL + `activation/${token}`;

    const msg = {
      to: email,
      from: "nicolas.rokicki@plissime.fr", // Doit être vérifié dans SendGrid
      subject: "Bienvenue sur Plissime - Crée ton espace personnel !",
      html: `
        <p>Salut ${firstName},</p>
        <p>Ton coach vient de te rajouter à notre plateforme Plissime !</p>
        <p>Tu peux dès maintenant créer ton espace personnel pour suivre tes entraînements, échanger avec ton coach et suivre tes progrès.</p>
        <a href="${finalisationUrl}" style="display:inline-block;background-color:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Finaliser mon inscription</a>
        <p>Une fois connecté(e), tu seras automatiquement rattaché(e) à ton coach et tu pourras commencer à profiter de tout ce que la plateforme a à t’offrir.</p>
        <p>Si tu rencontres le moindre souci, n’hésite pas à nous écrire.</p>
        <p>Bienvenue chez Plissime 💪</p>
        <p>A très vite!</p>
      `,
    };

    await sgMail.send(msg);

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

// ========== SIGNUP ==========
router.post("/customer/signup", fileUpload(), async (req, res) => {
  try {
    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

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
      coachs,
    } = req.body;

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
      coachs: coachs,
      //planning infos
      token: token,
      hash: hash,
      salt: salt,
    });

    //Export avatar to Cloudinary a faire

    // if (req.files) {
    //   const avatarToUpload = req.files.avatar;

    //   const avatar = await cloudinary.uploader.upload(
    //     convertToBase64(avatarToUpload),
    //     {
    //       public_id: `marvel/avatar/${newUser.id}`,
    //       overwrite: true,
    //     }
    //   );

    //   newUser.account.avatar = avatar;
    // }

    await newCustomer.save();

    res.status(200).json({
      _id: newCustomer.id,
      token: newCustomer.token,
      account: {
        email: newCustomer.email,
        // Voir pour confirmé l'avatar
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

module.exports = router;
