import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { MemoryStore } from './storage/memory-store';
import { SessionManager } from './services/session-manager';
import { ActivityLoader } from './services/activity-loader';
import { QRGenerator } from './services/qr-generator';
import { PollHandler } from './activities/poll-handler';
import { QuizHandler } from './activities/quiz-handler';
import { SocketHandler } from './socket/socket-handler';

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow Chrome extensions and configured origins
      if (
        !origin ||
        origin.startsWith('chrome-extension://') ||
        config.corsOrigins.some((allowed) => allowed === origin || allowed === 'chrome-extension://*')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services
const memoryStore = new MemoryStore();
const sessionManager = new SessionManager(memoryStore);
const activityLoader = new ActivityLoader();
const qrGenerator = new QRGenerator();
const pollHandler = new PollHandler();
const quizHandler = new QuizHandler();

// Initialize Socket.IO handler
const socketHandler = new SocketHandler(
  io,
  sessionManager,
  activityLoader,
  qrGenerator,
  pollHandler,
  quizHandler
);

socketHandler.initialize();

// Start server
httpServer.listen(config.port, () => {
  console.log(`\n🚀 Interactive Presentations Server`);
  console.log(`📡 Server running on http://localhost:${config.port}`);
  console.log(`🎯 Attendee app URL: ${config.attendeeAppUrl}`);
  console.log(`🔌 WebSocket ready for connections`);
  console.log(`\nEnvironment: ${config.nodeEnv}`);
  console.log(`Session expiry: ${config.sessionExpiryHours} hours\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
