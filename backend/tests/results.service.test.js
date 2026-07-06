import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { validateResultPayload, recordResult } from '../src/services/results.js';

const payload = { grupo: 'A', challengeId: 'c1', categoria: 'excecoes', xp: 120,
  dicasUsadas: 0, tentativas: 1, tempoSegundos: 90, acertou: true };

describe('validateResultPayload', () => {
  it('aceita payload válido', () => { expect(validateResultPayload(payload).valid).toBe(true); });
  it('rejeita grupo ausente', () => { expect(validateResultPayload({ ...payload, grupo: '' }).valid).toBe(false); });
  it('rejeita xp negativo', () => { expect(validateResultPayload({ ...payload, xp: -5 }).valid).toBe(false); });
  it('rejeita acertou não-boolean', () => { expect(validateResultPayload({ ...payload, acertou: 'sim' }).valid).toBe(false); });
});

describe('recordResult', () => {
  it('grava submission e incrementa xp do grupo', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 0 }] });
    const r = await recordResult(repo, payload);
    expect(r.ok).toBe(true);
    expect((await repo.listGroups()).find((g) => g.nome === 'A').xp).toBe(120);
    expect(await repo.listSubmissions()).toHaveLength(1);
  });
  it('payload inválido não grava nada', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 0 }] });
    const r = await recordResult(repo, { ...payload, grupo: '' });
    expect(r.ok).toBe(false);
    expect(await repo.listSubmissions()).toHaveLength(0);
    expect((await repo.listGroups()).find((g) => g.nome === 'A').xp).toBe(0);
  });
});
