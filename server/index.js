console.log('RUNNING SERVER INDEX.JS FROM /server');

const path = require('path');
// Use path.join to ensure cross-platform compatibility for the .env path
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // Best practice: use env var for origin
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' 
  });
});

// Import Routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const portfolioRoutes = require('./routes/portfolio');
const aiRoutes = require('./routes/ai');
const newsRoutes = require('./routes/news');
const paymentRoutes = require('./routes/payment');
const learningRoutes = require('./routes/learning');
const blogRoutes = require('./routes/blog');
const watchlistRoutes = require('./routes/watchlist');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/watchlist', watchlistRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in .env');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in .env');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Initialize External Services
    socketService.connect().catch(err => console.error('Socket init warning:', err.message));
    
    const { startAlertMonitor } = require('./services/alertMonitor');
    startAlertMonitor();

    // Only listen if this file is run directly (not via a test runner or serverless function)
    if (require.main === module) {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();

// Export for Vercel/Serverless/Tests
module.exports = app;
