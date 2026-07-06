import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import * as svc from '../src/services/challenges.js';

const valido = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [['try', 'catch']], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

describe('validateChallengeShape', () => {
  it('aceita desafio válido', () => {
    expect(svc.validateChallengeShape(valido).valid).toBe(true);
  });
  it('rejeita id ausente', () => {
    const r = svc.validateChallengeShape({ ...valido, id: undefined });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/id/);
  });
  it('exige exatamente 3 dicas', () => {
    const r = svc.validateChallengeShape({ ...valido, dicas: ['só uma'] });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/dicas/);
  });
  it('exige regras.obrigatorios como array', () => {
    const r = svc.validateChallengeShape({ ...valido, regras: { ...valido.regras, obrigatorios: 'x' } });
    expect(r.valid).toBe(false);
  });
});

describe('CRUD de desafios', () => {
  it('cria válido e recusa inválido', async () => {
    const repo = createMemoryRepo();
    const ok = await svc.createChallenge(repo, valido);
    expect(ok.ok).toBe(true);
    const bad = await svc.createChallenge(repo, { ...valido, id: '' });
    expect(bad.ok).toBe(false);
    expect(await svc.listChallenges(repo)).toHaveLength(1);
  });
  it('update de inexistente devolve notFound', async () => {
    const repo = createMemoryRepo();
    const r = await svc.updateChallenge(repo, 'nope', { titulo: 'x' });
    expect(r.ok).toBe(false);
    expect(r.notFound).toBe(true);
  });
  it('reorder atualiza modulo/ordem', async () => {
    const repo = createMemoryRepo();
    await svc.createChallenge(repo, valido);
    await svc.createChallenge(repo, { ...valido, id: 'c2', modulo: 1, ordem: 2 });
    await svc.reorderChallenges(repo, [{ id: 'c2', modulo: 1, ordem: 1 }, { id: 'c1', modulo: 1, ordem: 2 }]);
    const list = await svc.listChallenges(repo);
    expect(list[0].id).toBe('c2');
  });
});
