const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Program = require("../models/Program");

// ========== CREATE PROGRAM ==========
router.post("/program/add", isAuthenticated, async (req, res) => {
  try {
    const { title, duration, notes, sessions } = req.body;

    const newProgram = new Program({
      title: title,
      coach: req.user,
      duration: duration,
      notes: notes,
      sessions: sessions,
    });

    await newProgram.save();

    res.status(201).json(newProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MODIFY PROGRAM ==========
router.put("/program/modify/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, duration, notes, sessions } = req.body;

    const programToModify = await Program.findByIdAndUpdate(
      req.params.id,
      {
        title: title,
        duration: duration,
        notes: notes,
      },
      { new: true }
    );
    res.status(201).json({ message: "Programme modifiée!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY COACH PROGRAMS ==========
router.get("/programs", isAuthenticated, async (req, res) => {
  try {
    const filter = { coach: req.user._id };

    let programs = await Program.find(filter)
      .populate("coach")
      .populate("sessions.exercises.movement");

    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY ONE PROGRAM ==========
router.get("/programs/:id", isAuthenticated, async (req, res) => {
  try {
    let programToFind = await Program.findById(req.params.id).populate("coach");

    res.status(200).json(programToFind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== DISPLAY ONE SESSION ==========
router.get(
  "/program/:programid/session/:sessionid",
  isAuthenticated,
  async (req, res) => {
    try {
      const programToFind = await Program.findById(
        req.params.programid
      ).populate("sessions.exercises.movement");
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
            exercise: [],
          },
        },
      },
      { new: true }
    );
    res.status(201).json(programToModify);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ADD NEW EXERCISE ==========
router.post(
  "/program/:programid/session/:sessionid/exercise/add",
  isAuthenticated,
  async (req, res) => {
    try {
      const {
        movement,
        series,
        repetitions,
        weight,
        duration,
        restTime,
        notes,
      } = req.body;

      const program = await Program.findById(req.params.programid);

      program.sessions[req.params.sessionid - 1].exercises.push({
        movement: movement,
        series: series,
        repetitions: repetitions,
        weight: weight,
        duration: duration,
        restTime: restTime,
        notes: notes,
      });

      await program.save();

      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========== DISPLAY ONE EXERCISE ==========
router.get(
  "/program/:programid/session/:sessionid/exercise/:exerciseid",
  isAuthenticated,
  async (req, res) => {
    try {
      const programToFind = await Program.findById(
        req.params.programid
      ).populate("sessions.exercises.movement");

      programToFind.sessions[req.params.sessionid - 1].exercises.map((exo) => {
        if (String(exo._id) === req.params.exerciseid) {
          res.status(201).json(exo);
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========== MODIFY EXERCISE ==========
router.put(
  "/program/:programid/session/:sessionid/exercise/modify/:exerciseid",
  isAuthenticated,
  async (req, res) => {
    try {
      const {
        category,
        movement,
        series,
        repetitions,
        weight,
        duration,
        restTime,
        notes,
      } = req.body;

      const programToModify = await Program.findById(req.params.programid);
      if (!programToModify)
        return res.status(404).json({ message: "Programme non trouvé" });

      const exercise = programToModify.sessions[
        req.params.sessionid - 1
      ].exercises.find((exo) => String(exo._id) === req.params.exerciseid);
      if (!exercise)
        return res.status(404).json({ message: "Exercice non trouvé" });

      exercise.movement = movement;
      exercise.series = series;
      exercise.repetitions = repetitions;
      exercise.weight = weight;
      exercise.duration = duration;
      exercise.restTime = restTime;
      exercise.notes = notes;

      await programToModify.save();

      res.status(201).json(programToModify);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========== DELETE EXERCISE ==========
router.delete(
  "/program/:programid/session/:sessionid/exercise/:exerciseid",
  isAuthenticated,
  async (req, res) => {
    try {
      const programToModify = await Program.findById(
        req.params.programid
      ).populate("sessions.exercises.movement");

      const sessionIndex = req.params.sessionid - 1;
      const session = programToModify.sessions[sessionIndex];

      const exerciseIndex = session.exercises.findIndex(
        (exo) => String(exo._id) === req.params.exerciseid
      );

      session.exercises.splice(exerciseIndex, 1);

      await programToModify.save();

      res.status(201).json(programToModify);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
