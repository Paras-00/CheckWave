import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';
import config from '../src/config/config.js';

describe('Auth API Endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User.prototype, 'save').mockImplementation(async function () {
        this._id = '507f1f77bcf86cd799439011';
        return this;
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'jane@example.com');
    });

    it('should return 409 if user email already exists', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'jane@example.com'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password@123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should return 400 when given invalid input data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body).toHaveProperty('details');
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials and return JWT', async () => {
      const mockUser = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashedpassword'
      });
      mockUser._id = '507f1f77bcf86cd799439011';

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(mockUser, 'comparePassword').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('jane@example.com');
    });

    it('should return 401 when password does not match', async () => {
      const mockUser = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashedpassword'
      });

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(mockUser, 'comparePassword').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 when user is not found', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when request lacks authorization token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    it('should return user profile with valid authorization token', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = jwt.sign(
        { id: userId, email: 'jane@example.com', name: 'Jane Doe' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const mockUser = {
        _id: userId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        toJSON: () => ({ id: userId, name: 'Jane Doe', email: 'jane@example.com' })
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
    });
  });
});
