import app from './app.js';
import config from './config/config.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { startWorker, stopWorker } from './jobs/health-check.worker.js';
import logger from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Start background health check worker
    startWorker();

    // 3. Start Express HTTP server
    server = app.listen(config.port, () => {
      logger.info(`CheckWave Backend Server is listening on port ${config.port} [${config.env}]`);
      logger.info(`Health check probe available at http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('selection timed out') || error.message.includes('EACCES') || error.message.includes('connect'))) {
      logger.warn(`Could not connect to MongoDB at "${config.mongoUri}".`);
      logger.warn('Hint: Please ensure your MongoDB service is running (e.g., run "mongod", start the MongoDB Windows service, or run "docker compose up -d").');
    }
    process.exit(1);
  }
};

// Graceful shutdown logic
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new HTTP requests
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');

      try {
        // Stop background worker
        await stopWorker();

        // Disconnect database
        await disconnectDatabase();

        logger.info('Graceful shutdown completed successfully.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err.message);
        process.exit(1);
      }
    });

    // Force shutdown after timeout if hanging
    setTimeout(() => {
      logger.error('Forcefully terminating process after shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

startServer();

export default server;
