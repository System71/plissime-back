const express = require("express");
const router = express.Router();
const User = require("../models/User");
const fileUpload = require("express-fileupload");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
// const convertToBase64 = require("../utils/converToBase64");

// ========== SIGNUP ==========
router.post("/user/signup", fileUpload(), async (req, res) => {
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
      activity,
      siret,
      certification,
      subscription,
    } = req.body;

    //Verification if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    //Verification if email doesn't exist

    const checkMail = await User.findOne({ email: email });

    if (checkMail) {
      return res.status(400).json({ message: "Email already used" });
    }

    const newUser = new User({
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
      //planning infos
      subscription: subscription,
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

    await newUser.save();

    res.status(200).json({
      _id: newUser.id,
      token: newUser.token,
      account: {
        email: newUser.email,
        // Voir pour confirmé l'avatar
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.status(200).json({
      _id: userToSearch.id,
      token: userToSearch.token,
      email: userToSearch.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
