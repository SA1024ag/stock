console.log('RUNNING SERVER INDEX.JS FROM /server');

// Always load env vars from the server/.env file,
// regardless of where the process is started from.
require('dotenv').config({ path: __dirname + '/.env' });

console.log('MONGODB_URI =>', process.env.MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Routes (ONLY after DB is connected)
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/stocks', require('./routes/stocks'));
    app.use('/api/portfolio', require('./routes/portfolio'));
    app.use('/api/ai', require('./routes/ai'));

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
