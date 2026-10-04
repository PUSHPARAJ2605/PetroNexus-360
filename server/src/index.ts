import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { sensorSimulator } from './services/sensorSimulator/sensorSimulator';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configure Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'PetroNexus 360 Digital Twin Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    disclaimer: 'PetroNexus 360 Heavy Oil Digital Twin & Simulation Platform.',
  });
});

// Socket.IO event listeners
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Digital Twin stream: ${socket.id}`);

  // Send immediate telemetry snapshot
  socket.emit('telemetry_tick', sensorSimulator.getCurrentState());

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  socket.on('request_state', () => {
    socket.emit('telemetry_tick', sensorSimulator.getCurrentState());
  });
});

// Initialize background sensor simulator with Socket.IO
sensorSimulator.init(io);

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 PetroNexus 360 Digital Twin Server Running`);
  console.log(`📡 HTTP & WebSocket: http://localhost:${PORT}`);
  console.log(`🌐 API Endpoints:    http://localhost:${PORT}/api`);
  console.log(`⚠️  Prototype Mode:    Active (Simulated telemetry)`);
  console.log(`=======================================================`);
});
