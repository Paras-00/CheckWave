import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Performs a health check for a given monitor.
 *
 * @param {Object} monitor - Monitor mongoose document or object
 * @returns {Promise<{ isUp: boolean, statusCode: number|null, responseTime: number, errorMessage: string|null, status: 'up'|'down'|'timeout'|'error' }>}
 */
export const performCheck = async (monitor) => {
  const timeoutMs = monitor.timeout || 30000;
  const method = (monitor.method || 'GET').toUpperCase();

  // Convert headers from Map or plain object
  let headers = {
    'User-Agent': 'CheckWave-HealthCheck/1.0'
  };

  if (monitor.headers) {
    if (monitor.headers instanceof Map) {
      headers = { ...headers, ...Object.fromEntries(monitor.headers) };
    } else if (typeof monitor.headers === 'object') {
      headers = { ...headers, ...monitor.headers };
    }
  }

  // Parse body if applicable
  let data = null;
  if (['POST', 'PUT', 'PATCH'].includes(method) && monitor.body) {
    try {
      data = typeof monitor.body === 'string' ? JSON.parse(monitor.body) : monitor.body;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } catch {
      data = monitor.body;
    }
  }

  const startTime = Date.now();

  try {
    const response = await axios({
      url: monitor.url,
      method,
      headers,
      data,
      timeout: timeoutMs,
      maxRedirects: 5,
      validateStatus: () => true // Allow handling of 4xx and 5xx directly
    });

    const elapsed = Date.now() - startTime;
    const responseTime = Math.min(elapsed, timeoutMs);
    const statusCode = response.status;

    // 2xx and 3xx are considered UP; 4xx and 5xx are considered DOWN
    if (statusCode >= 200 && statusCode < 400) {
      return {
        isUp: true,
        statusCode,
        responseTime,
        errorMessage: null,
        status: 'up'
      };
    } else {
      return {
        isUp: false,
        statusCode,
        responseTime,
        errorMessage: `HTTP ${statusCode}: ${response.statusText || 'Response error'}`,
        status: 'down'
      };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const responseTime = Math.min(elapsed, timeoutMs);

    let status = 'error';
    let errorMessage = error.message || 'Unknown network error';
    const statusCode = error.response ? error.response.status : null;

    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      status = 'timeout';
      errorMessage = `Request timed out after ${timeoutMs}ms`;
    } else if (error.code === 'ECONNREFUSED') {
      status = 'error';
      errorMessage = 'Connection refused by server';
    } else if (error.code === 'ENOTFOUND') {
      status = 'error';
      errorMessage = 'DNS resolution failed: Host not found';
    } else if (error.code === 'ECONNRESET') {
      status = 'error';
      errorMessage = 'Connection was reset by server';
    }

    logger.debug(`Health check failed for monitor ${monitor.name} (${monitor.url}): ${errorMessage}`);

    return {
      isUp: false,
      statusCode,
      responseTime,
      errorMessage,
      status
    };
  }
};

export default {
  performCheck
};
