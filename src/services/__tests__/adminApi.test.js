// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdminToken, listChallengesAdmin, createChallenge, updateChallenge, deleteChallenge, reorderChallenges } from '../adminApi.js';

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

describe('listChallengesAdmin', () => {
  it('retorna a lista em sucesso', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [{ id: 'c1' }] });
    const r = await listChallengesAdmin('tok');
    expect(r.ok).toBe(true);
    expect(r.data).toEqual([{ id: 'c1' }]);
  });
});

describe('createChallenge', () => {
  it('em sucesso devolve o desafio criado', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'c1' }) });
    const r = await createChallenge('tok', { id: 'c1' });
    expect(r.ok).toBe(true);
    expect(r.data.id).toBe('c1');
  });

  it('em erro de validação (400) junta as mensagens de erro', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errors: ['id é obrigatório', 'dicas deve ter exatamente 3 itens'] })
    });
    const r = await createChallenge('tok', {});
    expect(r.ok).toBe(false);
    expect(r.error).toBe('id é obrigatório dicas deve ter exatamente 3 itens');
  });
});

describe('updateChallenge', () => {
  it('404 devolve a mensagem do backend', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Desafio não encontrado.' })
    });
    const r = await updateChallenge('tok', 'nope', { titulo: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Desafio não encontrado.');
  });
});

describe('deleteChallenge', () => {
  it('em sucesso devolve ok:true', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await deleteChallenge('tok', 'c1');
    expect(r.ok).toBe(true);
  });
});

describe('reorderChallenges', () => {
  it('envia a nova ordem e devolve ok:true', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await reorderChallenges('tok', [{ id: 'c1', modulo: 1, ordem: 1 }]);
    expect(r.ok).toBe(true);
  });
});
