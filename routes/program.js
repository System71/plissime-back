const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Program = require("../models/Program");

// ========== CREATE PROGRAM ==========
router.post("/program/add", isAuthenticated, async (req, res) => {
  try {
    const { title, startDate, endDate, notes, sessions } = req.body;

    const newProgram = new Program({
      title: title,
      coach: req.user,
      // customer: customer,
      startDate: startDate,
      endDate: endDate,
      notes: notes,
      sessions: sessions,
    });

    await newProgram.save();

    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ADD NEW SESSION ==========
router.post("/program/:id/session/add", isAuthenticated, async (req, res) => {
  try {
    const programToModify = await Program.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          sessions: {
            day: "",
            exercise: [],
          },
        },
      },
      { new: true }
    );
    console.log("programToModify=", programToModify);
    res.status(201).json(programToModify);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY SESSION ==========
router.get(
  "/program/:programid/session/:sessionid",
  isAuthenticated,
  async (req, res) => {
    try {
      const programToFind = await Program.findById(req.params.programid);
      console.log("programTofind=", programToFind);
      res.status(201).json(programToFind.sessions[req.params.sessionid - 1]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========== ADD NEW SESSION ==========
router.post("/program/:id/session/add", isAuthenticated, async (req, res) => {
  try {
    const programToModify = await Program.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          sessions: {
            day: "",
            exercise: [],
          },
        },
      },
      { new: true }
    );
    console.log("programToModify=", programToModify);
    res.status(201).json(programToModify);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ========== ADD NEW EXERCISE ==========
router.post(
  "/program/:programid/session/:sessionid/add",
  isAuthenticated,
  async (req, res) => {
    try {
      const path = `sessions.(req.params.sessionid).exercices`;

      const programToModify = await Program.findByIdAndUpdate(
        req.params.programid,
        {
          $push: {
            [path]: {
              movement: "",
              series: "",
              repetitions: "",
              weight: "",
              duration: "",
              restTime: "",
              notes: "",
            },
          },
        },
        { new: true }
      );
      console.log("programToModify=", programToModify);
      res.status(201).json(programToModify);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
