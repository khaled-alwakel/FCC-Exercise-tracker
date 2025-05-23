const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const User = require("./models/user");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  if (!req.body || !req.body.username) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const username = req.body.username;
  const newUser = new User({ username: username });
  newUser
    .save()
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch((err) => {
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    const usersArray = [];
    users.forEach((user) => {
      const { _id, username } = user;
      usersArray.push({ _id, username });
    });
    res.status(200).json(usersArray);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  if (!req.body || !req.body.description || !req.body.duration) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  let { description, duration, date } = req.body;

  const { _id } = req.params;
  const userId = _id;

  if (!date) {
    const today = new Date();
    date = today.toDateString();
  }
  if (date.toString() === "Invalid Date") {
    return res.status(400).json({ error: "Invalid date" });
  }
  date = new Date(date).toDateString();

  const newExercise = {
    description: description,
    duration: duration,
    date: date,
  };
  User.findById(userId).then((user) => {
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.exercises.push(newExercise);
    user
      .save()
      .then((user) => {
        res.json({
          _id: user._id,
          username: user.username,
          date: newExercise.date,
          duration: +newExercise.duration,
          description: newExercise.description,
        });
      })
      .catch((err) => {
        res.status(500).json({ error: "Internal server error" });
      });
  });
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  let { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let filteredExercises = user.exercises;

    // Filter by date range if 'from' and 'to' parameters are provided
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      filteredExercises = filteredExercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      });
    }

    // Sort exercises by date in ascending order
    filteredExercises.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Limit the number of exercises if 'limit' parameter is provided
    if (limit) {
      const exerciseLimit = parseInt(limit);
      if (isNaN(exerciseLimit) || exerciseLimit <= 0) {
        return res.status(400).json({ error: "Invalid limit value" });
      }
      filteredExercises = filteredExercises.slice(0, exerciseLimit);
    }

    return res.json({
      _id: user._id,
      username: user.username,
      count: filteredExercises.length,
      log: filteredExercises,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
