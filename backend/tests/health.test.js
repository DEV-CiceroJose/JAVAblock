import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

describe('health', () => {
  it('GET /api/health responde 200', async () => {
    const app = createApp(createMemoryRepo());
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
