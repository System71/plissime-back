const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const isAuthenticated = require("../middlewares/isAuthenticated");
// const convertToBase64 = require("../utils/converToBase64");

// ========== DISPLAY COACH CUSTOMERS ==========
router.get("/mycustomers", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.query;
    const filter = { coachs: { $in: [req.user] } };
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const myCustomers = await Customer.find(filter).sort({ name: 1 });
    console.log("reponse=", myCustomers);
    res.status(201).json(myCustomers);
  } catch (error) {
    res.status(500).send("Erreur d'authentification !");
  }
});

// ========== DISPLAY ONE CUSTOMER ==========
router.get("/find/customer/:id", isAuthenticated, async (req, res) => {
  try {
    const customerTofind = await Customer.findById(req.params.id);
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

    console.log("req.body", req.body);

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
    console.log("customer modifié=", customerToModify);
    res.status(201).json({ message: "Customer modifié!" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
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
      { token: req.params.token },
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
    res.status(200).json({
      message: "Compte activé avec succés!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== PRESIGNUP ==========
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

    console.log(newCustomer);

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
