import mongoose from 'mongoose';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';
import Metric from '../models/Metric.js';
import Incident from '../models/Incident.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { REAL_SITES_CATALOG } from '../../../frontend/src/data/sampleDataset200.js';
import logger from './logger.js';

const DEMO_EMAIL = 'demo@checkwave.io';
const DEMO_PASSWORD = 'Demo@1234';

export const seedDatabase = async () => {
  try {
    logger.info('Starting CheckWave 200 Real-World Websites seed script...');
    await connectDatabase();

    let demoUser = await User.findOne({ email: DEMO_EMAIL });

    if (demoUser) {
      logger.info(`Refreshing demo datasets for ${DEMO_EMAIL}...`);
      await Promise.all([
        Metric.deleteMany({ user: demoUser._id }),
        Incident.deleteMany({ user: demoUser._id }),
        Monitor.deleteMany({ user: demoUser._id })
      ]);
    } else {
      logger.info('Creating demo user account...');
      demoUser = new User({
        name: 'Demo Administrator',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
      });
      await demoUser.save();
    }

    const userId = demoUser._id;

    logger.info(`Inserting ${REAL_SITES_CATALOG.length} real-world public monitors into MongoDB...`);
    const monitorDocs = REAL_SITES_CATALOG.map((site, index) => {
      const idNum = index + 1;
      const is404 = site.url.includes('/status/404');
      const isPaused = idNum === 19 || idNum === 48;

      let status = 'active';
      let lastStatus = 'up';
      let lastStatusCode = 200;

      if (is404) {
        status = 'active';
        lastStatus = 'down';
        lastStatusCode = 404;
      } else if (isPaused) {
        status = 'paused';
      }

      let baseLatency = 45;
      if (site.category === 'Search & Portals') baseLatency = 35 + (idNum % 20);
      else if (site.category === 'Cloud Infrastructure') baseLatency = 28 + (idNum % 25);
      else if (site.category === 'Live Public APIs') baseLatency = 95 + (idNum % 70);
      else baseLatency = 65 + (idNum % 55);

      if (is404) baseLatency = 140;

      const uptime = is404 ? 92.45 : Math.round((99.75 + (idNum % 24) * 0.01) * 100) / 100;

      return {
        user: userId,
        name: site.name,
        url: site.url,
        method: 'GET',
        interval: idNum % 5 === 0 ? 1 : 5,
        timeout: 10000,
        status,
        lastStatus,
        lastStatusCode,
        lastResponseTime: baseLatency,
        lastChecked: new Date(Date.now() - (idNum % 30) * 60 * 1000),
        uptime7d: uptime,
        uptime30d: Math.min(99.99, uptime + 0.1)
      };
    });

    const createdMonitors = await Monitor.insertMany(monitorDocs);
    logger.info(`Inserted ${createdMonitors.length} real monitors.`);

    // Generate 5,000 real telemetry records (25 per monitor)
    logger.info('Generating 5,000 historical telemetry points for real monitors...');
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const allMetrics = [];

    for (let i = 0; i < createdMonitors.length; i++) {
      const mon = createdMonitors[i];
      const isDown = mon.lastStatus === 'down';

      for (let j = 0; j < 25; j++) {
        const timestamp = new Date(now - Math.floor(Math.random() * SEVEN_DAYS_MS));
        let isUp = true;
        let statusCode = 200;
        let statusStr = 'up';
        let errorMessage = null;
        let responseTime = Math.max(15, mon.lastResponseTime + Math.floor((Math.random() - 0.5) * 20));

        if (isDown && j < 5) {
          isUp = false;
          statusCode = 404;
          statusStr = 'down';
          errorMessage = 'HTTP 404: Not Found (Target test failure)';
        }

        allMetrics.push({
          monitor: mon._id,
          user: userId,
          timestamp,
          responseTime,
          statusCode,
          status: statusStr,
          errorMessage,
          isUp
        });
      }
    }

    const CHUNK_SIZE = 1000;
    for (let c = 0; c < allMetrics.length; c += CHUNK_SIZE) {
      await Metric.insertMany(allMetrics.slice(c, c + CHUNK_SIZE));
    }
    logger.info(`Inserted ${allMetrics.length} metrics.`);

    // Incidents
    const incident404 = createdMonitors.find((m) => m.url.includes('/status/404'));
    if (incident404) {
      await Incident.create({
        monitor: incident404._id,
        user: userId,
        title: `${incident404.name} returned HTTP 404`,
        status: 'open',
        severity: 'high',
        startedAt: new Date(now - 45 * 60 * 1000),
        resolvedAt: null,
        duration: null,
        errorMessage: 'HTTP 404: Target Not Found',
        affectedChecks: 9,
        resolvedBy: null
      });
    }

    console.log(`
============================================================
   CHECKWAVE 200 REAL-WORLD WEBSITES SEEDED SUCCESSFULLY   
============================================================
 Demo Account Credentials:
   - Email:     ${DEMO_EMAIL}
   - Password:  ${DEMO_PASSWORD}

 Datasets Loaded:
   - 200 100% Real, Clickable Websites & Live Public APIs
   - 5,000 Historical Metrics
   - Verified Active Incident Tracking
============================================================
    `);
  } catch (error) {
    logger.error('Error during database seed:', error.message);
    throw error;
  } finally {
    await disconnectDatabase();
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
