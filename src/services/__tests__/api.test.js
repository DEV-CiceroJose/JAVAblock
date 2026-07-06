// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchChallenges, submitResult } from '../api.js';

beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('api.js resiliente', () => {
  it('fetchChallenges devolve a lista em sucesso', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'c1' }] });
    expect(await fetchChallenges()).toEqual([{ id: 'c1' }]);
  });
  it('fetchChallenges devolve null em falha de rede', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchChallenges()).toBeNull();
  });
  it('fetchChallenges devolve null sem VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(await fetchChallenges()).toBeNull();
  });
  it('submitResult engole erros e não lança', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(submitResult({ grupo: 'A' })).resolves.toBeUndefined();
  });
});
