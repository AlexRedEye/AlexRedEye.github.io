const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
  host: 'sql5.freesqldatabase.com',
  user: 'sql5693290',
  password: 'HpEALIJBct',
  database: 'sql5693290'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database!');
});

// Endpoint to get leaderboard entries
app.get('/leaderboard', (req, res) => {
  connection.query('SELECT * FROM leaderboard ORDER BY lap_time ASC', (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

// Endpoint to add a new leaderboard entry
app.post('/leaderboard', (req, res) => {
  const { driverName, trackName, carName, lapTime, youtubeLink } = req.body;
  connection.query('INSERT INTO leaderboard (driver_name, track_name, car_name, lap_time, youtube_link) VALUES (?, ?, ?, ?, ?)',
    [driverName, trackName, carName, lapTime, youtubeLink],
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.sendStatus(201); // Created
      }
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});