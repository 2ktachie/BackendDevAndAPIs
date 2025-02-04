const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model('User', UserSchema);

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  try {
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users.map(user => ({
      username: user.username,
      _id: user._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

const ExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exercise = new Exercise({
      userId,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error saving exercise' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercises = await Exercise.find(query).limit(limit ? Number(limit) : 0);

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving exercise log' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})