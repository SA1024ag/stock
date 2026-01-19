console.log('RUNNING SERVER INDEX.JS FROM /server');
// Trigger restart for env vars

// Always load env vars from the server/.env file,
// regardless of where the process is started from.
require('dotenv').config({ path: __dirname + '/.env' });

console.log('MONGODB_URI =>', process.env.MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Server from socket.io
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app); // Create HTTP server

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity (or specify client URL)
    methods: ["GET", "POST"]
  }
});

// Store io in app instance for routes to use
app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected (Community):', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected (Community):', socket.id);
  });
});

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

    // Initialize Upstox Socket
    socketService.connect().catch(err => console.error('Socket init warning:', err.message));

    // Routes (ONLY after DB is connected)
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/stocks', require('./routes/stocks'));
    app.use('/api/portfolio', require('./routes/portfolio'));
    app.use('/api/ai', require('./routes/ai'));
    app.use('/api/news', require('./routes/news'));
    app.use('/api/payment', require('./routes/payment'));
    app.use('/api/learning', require('./routes/learning'));
    app.use('/api/blog', require('./routes/blog')); // Add blog routes

    // Use server.listen instead of app.listen
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();

