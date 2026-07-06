import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

describe('error boundary', () => {
  it('handler que rejeita responde 500 em vez de pendurar', async () => {
    const repo = createMemoryRepo();
    repo.listChallenges = async () => { throw new Error('falha simulada'); };
    const app = createApp(repo);
    const res = await request(app).get('/api/challenges');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});
