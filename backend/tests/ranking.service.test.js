import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { getRanking, sortRanking } from '../src/services/ranking.js';

describe('ranking', () => {
  it('sortRanking ordena por xp desc sem mutar', () => {
    const orig = [{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }, { nome: 'C', xp: 20 }];
    const sorted = sortRanking(orig);
    expect(sorted.map((g) => g.nome)).toEqual(['B', 'C', 'A']);
    expect(orig[0].nome).toBe('A');
  });
  it('getRanking lê do repo ordenado', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }] });
    const r = await getRanking(repo);
    expect(r[0].nome).toBe('B');
  });
});
