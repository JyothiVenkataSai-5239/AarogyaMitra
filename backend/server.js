const dns = require('dns');                          
dns.setServers(['8.8.8.8', '1.1.1.1']);             

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { setIo } = require('./services/realtimeService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

setIo(io);

io.on('connection', (socket) => {
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-appointment';

console.log('Attempting to connect to MongoDB...');
console.log('URI (without password):', MONGODB_URI.replace(/:[^@]+@/, ':****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
  });

// Routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);


// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Medical Appointment System API' });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
