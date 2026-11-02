import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/checkwave',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  metricRetentionDays: parseInt(process.env.METRIC_RETENTION_DAYS, 10) || 90
};

export const {
  port,
  env,
  isProduction,
  isTest,
  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  redisUrl,
  frontendUrl,
  metricRetentionDays
} = config;

export default config;
