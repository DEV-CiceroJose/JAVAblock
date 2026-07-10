// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdminToken } from '../adminApi.js';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('verifyAdminToken', () => {
  it('sem VITE_API_URL retorna erro de backend não configurado', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const r = await verifyAdminToken('qualquer');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.');
  });

  it('token correto retorna ok', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await verifyAdminToken('correto');
    expect(r.ok).toBe(true);
  });

  it('token errado (401) retorna "Token inválido."', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token inválido ou ausente.' })
    });
    const r = await verifyAdminToken('errado');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Token inválido.');
  });

  it('falha de rede retorna erro de backend não configurado', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    const r = await verifyAdminToken('qualquer');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.');
  });
});
