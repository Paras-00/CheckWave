import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Monitor from '../src/models/Monitor.js';
import queueService from '../src/jobs/queue.js';
import config from '../src/config/config.js';

describe('Monitor API Endpoints', () => {
  const userId = '507f1f77bcf86cd799439011';
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { id: userId, email: 'tester@example.com', name: 'Tester' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/monitors', () => {
    it('should return 401 if request is not authenticated', async () => {
      const res = await request(app).get('/api/monitors');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user monitors when authenticated', async () => {
      const mockMonitors = [
        {
          _id: '507f1f77bcf86cd799439022',
          name: 'App Server',
          url: 'https://app.example.com',
          status: 'active',
          user: userId
        }
      ];

      jest.spyOn(Monitor, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockMonitors)
      });

      const res = await request(app)
        .get('/api/monitors')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monitors).toHaveLength(1);
      expect(res.body.data.monitors[0].name).toBe('App Server');
    });
  });

  describe('POST /api/monitors', () => {
    it('should create a monitor successfully and schedule check', async () => {
      jest.spyOn(Monitor.prototype, 'save').mockImplementation(async function () {
        this._id = '507f1f77bcf86cd799439022';
        return this;
      });
      jest.spyOn(queueService, 'scheduleMonitor').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/monitors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Main Website',
          url: 'https://example.com',
          method: 'GET',
          interval: 5,
          timeout: 5000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monitor.name).toBe('Main Website');
      expect(res.body.data.monitor.url).toBe('https://example.com');
    });

    it('should fail validation when URL is invalid', async () => {
      const res = await request(app)
        .post('/api/monitors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Broken URL Test',
          url: 'ftp://not-valid-http-url'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'url')).toBe(true);
    });
  });

  describe('DELETE /api/monitors/:id', () => {
    it('should soft delete monitor and unschedule repeating jobs', async () => {
      const mockMonitor = {
        _id: '507f1f77bcf86cd799439022',
        name: 'Main Website',
        user: userId,
        isDeleted: false,
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Monitor, 'findOne').mockResolvedValue(mockMonitor);
      jest.spyOn(queueService, 'unscheduleMonitor').mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/monitors/507f1f77bcf86cd799439022')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMonitor.isDeleted).toBe(true);
      expect(mockMonitor.status).toBe('paused');
      expect(mockMonitor.save).toHaveBeenCalled();
    });

    it('should return 404 if monitor does not exist or belongs to another user', async () => {
      jest.spyOn(Monitor, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/monitors/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Monitor not found');
    });
  });
});
