import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { getConfig, setConfig, publicConfig } from '../src/services/config.js';

describe('config service', () => {
  it('lê config default', async () => {
    const repo = createMemoryRepo();
    const c = await getConfig(repo);
    expect(c.maxDicas).toBe(3);
  });
  it('setConfig faz merge', async () => {
    const repo = createMemoryRepo();
    const c = await setConfig(repo, { maxDicas: 5 });
    expect(c.maxDicas).toBe(5);
    expect(c.xpBase).toBe(100);
  });
  it('publicConfig só expõe campos do aluno', () => {
    const pub = publicConfig({ maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15,
      xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20, penalidadeErro: 10, penalidadeProibido: 20 });
    expect(pub.maxDicas).toBe(3);
    expect(pub.tempoEntreDicasSeg).toBe(15);
    expect(pub).not.toHaveProperty('penalidadeProibido');
  });
});
