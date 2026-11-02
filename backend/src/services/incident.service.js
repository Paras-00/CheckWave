import Incident from '../models/Incident.js';
import logger from '../utils/logger.js';

/**
 * Creates a new incident for a monitor.
 *
 * @param {Object} monitor
 * @param {string} errorMessage
 * @returns {Promise<Incident>}
 */
export const createIncident = async (monitor, errorMessage) => {
  try {
    const incident = new Incident({
      monitor: monitor._id,
      user: monitor.user,
      title: `${monitor.name} is down`,
      status: 'open',
      severity: (monitor.consecutiveFailures || 1) >= 5 ? 'critical' : 'high',
      startedAt: new Date(),
      errorMessage: errorMessage || 'Health check failed',
      affectedChecks: 1
    });

    await incident.save();
    logger.warn(`Incident created for monitor: ${monitor.name} (${monitor._id}) - Severity: ${incident.severity}`);
    return incident;
  } catch (err) {
    logger.error(`Failed to create incident for monitor ${monitor._id}: ${err.message}`);
    throw err;
  }
};

/**
 * Resolves an existing open incident.
 *
 * @param {Object} incident
 * @param {Object} monitor
 * @param {string} resolvedBy - 'auto' or 'manual'
 * @returns {Promise<Incident>}
 */
export const resolveIncident = async (incident, monitor, resolvedBy = 'auto') => {
  try {
    const now = new Date();
    incident.resolvedAt = now;
    const startTime = new Date(incident.startedAt).getTime();
    incident.duration = Math.max(0, now.getTime() - startTime);
    incident.status = 'resolved';
    incident.resolvedBy = resolvedBy;

    await incident.save();
    logger.info(`Incident resolved for monitor: ${monitor?.name || incident.monitor} (${incident._id}) - Duration: ${incident.duration}ms`);
    return incident;
  } catch (err) {
    logger.error(`Failed to resolve incident ${incident._id}: ${err.message}`);
    throw err;
  }
};

/**
 * Processes health check results, triggers incident creation or resolution, and updates monitor failure counts.
 *
 * @param {Object} monitor - Mongoose Monitor document
 * @param {Object} checkResult - Result from performCheck
 * @returns {Promise<Object>} Updated monitor
 */
export const handleCheckResult = async (monitor, checkResult) => {
  try {
    if (!checkResult.isUp) {
      monitor.consecutiveFailures = (monitor.consecutiveFailures || 0) + 1;
      monitor.lastStatus = 'down';

      // If consecutiveFailures >= 2, check for or create incident
      if (monitor.consecutiveFailures >= 2) {
        const openIncident = await Incident.findOne({
          monitor: monitor._id,
          status: 'open'
        });

        if (!openIncident) {
          await createIncident(monitor, checkResult.errorMessage);
        } else {
          openIncident.affectedChecks = (openIncident.affectedChecks || 1) + 1;
          if (monitor.consecutiveFailures >= 5 && openIncident.severity !== 'critical') {
            openIncident.severity = 'critical';
          }
          await openIncident.save();
        }
      }
    } else {
      // Check was successful
      monitor.consecutiveFailures = 0;
      monitor.lastStatus = 'up';

      // Check if there is an open incident to resolve automatically
      const openIncident = await Incident.findOne({
        monitor: monitor._id,
        status: 'open'
      });

      if (openIncident) {
        await resolveIncident(openIncident, monitor, 'auto');
      }
    }

    monitor.lastChecked = new Date();
    monitor.lastResponseTime = checkResult.responseTime;
    monitor.lastStatusCode = checkResult.statusCode;

    await monitor.save();
    return monitor;
  } catch (err) {
    logger.error(`Error handling check result for monitor ${monitor._id}: ${err.message}`);
    throw err;
  }
};

export default {
  handleCheckResult,
  createIncident,
  resolveIncident
};
