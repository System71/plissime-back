const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
// const convertToBase64 = require("../utils/converToBase64");

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

// ========== SIGNUP ==========
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
