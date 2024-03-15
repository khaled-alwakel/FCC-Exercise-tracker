const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const User = require('./models/user');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
 
});

app.post('/api/users', (req, res) => {
    if (!req.body || !req.body.username) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const username = req.body.username;
  const newUser = new User({ username: username });
  newUser.save().then(user => {
    res.json({ username: user.username, _id: user._id });
  }).catch(err => {
    res.status(500).json({ error: 'Internal server error' });
  })
});

app.get ('/api/users', async (req, res) => {

  try{
    const users = await User.find({})
    const usersArray = []
    users.forEach(user => {
      const {_id, username} = user
      usersArray.push({_id,username})
    });
    res.status(200).json(usersArray)
  }catch(error){
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.post('/api/users/:_id/exercises', (req, res) => {
  if (!req.body || !req.body.description || !req.body.duration ) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  let { description, duration, date } = req.body;

  const { _id } = req.params;
  const userId = _id;

  if (!date) {
    const today = new Date();
    date = today.toDateString();
  }
  if (date.toString() === 'Invalid Date') {
    return res.status(400).json({ error: 'Invalid date' });
  }
  date = new Date(date).toDateString();

  const newExercise = { description: description, duration: duration, date : date };
  User.findById(userId).then(user => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.exercises.push(newExercise);
    user.save().then(user => {
      res.json({
        _id: user._id,
        username: user.username,
        date: newExercise.date,
        duration: +newExercise.duration,
        description: newExercise.description,
      });

    }).catch(err => {
      res.status(500).json({ error: 'Internal server error' });
    });
  })

})
app.get ('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const userId = _id;
  let { from, to } = req.query;
  const {limit} = req.query.limit *1 ;


  User.findById(userId).then(user => {
    if (!user){
      return res.status(404).json({ error: 'User not found' });
    }
    const exercises = user.exercises;
    let filteredExercises = []
    let sortedExercises =[]

    if (from && to){
      if (from.toString() === 'Invalid Date'|| to.toString() === 'Invalid Date') {
        return res.status(400).json({ error: 'Invalid date' });
      }
      from = formateDateFrom(new Date (from))
      to = formateDateFrom(new Date (to))
      filteredExercises = exercises.filter(exercise => {
        const exerciseDate = formateDateFrom( new Date(exercise.date));
        return exerciseDate >= from && exerciseDate <= to;
      })
      sortedExercises = filteredExercises.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      })
      res.json({
        _id: user._id,
        username: user.username,
        count: sortedExercises.length,
        log: sortedExercises
      });
    }
 
    if (limit) {
      const limitedExercises = sortedExercises.slice(0, limit);
      res.json({
        _id: user._id,
        username: user.username,
        count: limitedExercises.length,
        log: limitedExercises
      });
    }
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises
    });
})
})

function formateDateFrom(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})