import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  attendeeAppUrl: process.env.ATTENDEE_APP_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
  corsOrigins: [
    process.env.ATTENDEE_APP_URL || 'http://localhost:5173',
    'chrome-extension://*',
  ],
};
