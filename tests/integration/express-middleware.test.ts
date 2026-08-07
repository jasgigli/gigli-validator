import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { middleware, v } from '../../src';

describe('Integration Testing: Express Backend API (Vitest + Supertest)', () => {
  const app = express();
  app.use(express.json());

  // Registration route with request body validation and XSS security
  const registerSchema = v.object({
    username: v.string().min(3).max(20).alphanumeric(),
    email: v.string().trim().toLowerCase().email(),
    age: v.number().int().min(18),
    bio: v.string().xss().sanitize().optional(),
  });

  app.post(
    '/api/register',
    middleware({ body: registerSchema }),
    (req: express.Request, res: express.Response) => {
      res.status(200).json({
        success: true,
        user: req.body,
      });
    }
  );

  // Search route with query parameters validation
  const searchSchema = v.object({
    q: v.string().min(1),
    limit: v.number().min(1).max(100).default(10),
  });

  app.get(
    '/api/search',
    middleware({ query: searchSchema }),
    (req: express.Request, res: express.Response) => {
      res.status(200).json({
        success: true,
        query: req.query,
      });
    }
  );

  it('accepts valid HTTP POST payload and transforms email/bio', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'john123',
        email: '  JOHN@EXAMPLE.COM  ',
        age: 25,
        bio: '<b>Developer</b>',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('john@example.com');
    expect(res.body.user.bio).toBe('&lt;b&gt;Developer&lt;&#x2F;b&gt;');
  });

  it('rejects invalid POST payload with HTTP 400 Bad Request and structured error field details', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'jo',
        email: 'not-an-email',
        age: 15,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid request payload');
    expect(res.body.errors.fieldErrors.username).toBeDefined();
    expect(res.body.errors.fieldErrors.email).toBeDefined();
    expect(res.body.errors.fieldErrors.age).toBeDefined();
  });

  it('blocks XSS attack payload on Express endpoint with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'validuser',
        email: 'user@test.com',
        age: 21,
        bio: '<script>alert("hacked")</script>',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.fieldErrors.bio).toBeDefined();
  });
});
