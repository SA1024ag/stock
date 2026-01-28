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
// Import Upstox Service to initialize tokens on startup
const upstoxAuthService = require('./services/upstoxAuthService'); 

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // Use env var for production security
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
// Update CORS to allow credentials and match client URL
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));
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
const upstoxAuthRoutes = require('./routes/upstoxAuth'); // Ensure this is imported

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/upstox', upstoxAuthRoutes); // Mount Upstox auth routes specifically
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
    console.log('✅ MongoDB connected');

    // 1. Initialize Upstox Service (Load tokens from DB)
    // This is crucial for the fallback system to work on server restart
    try {
        if (upstoxAuthService.init) {
            await upstoxAuthService.init();
            console.log('🚀 Upstox Service Initialized (Tokens Loaded)');
        }
    } catch (e) {
        console.warn('⚠️ Upstox Token Load Warning:', e.message);
    }

    // 2. Initialize Socket Service
    socketService.connect().catch(err => console.error('Socket init warning:', err.message));
    
    // 3. Start Alert Monitor
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
