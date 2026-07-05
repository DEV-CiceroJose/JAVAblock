import { describe, it, expect } from 'vitest';
import { sortRanking, addXP } from '../ranking.js';

describe('ranking', () => {
  it('ordena por xp desc', () => {
    const r = sortRanking([{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }, { nome: 'C', xp: 20 }]);
    expect(r.map((g) => g.nome)).toEqual(['B', 'C', 'A']);
  });
  it('addXP soma sem mutar o original', () => {
    const orig = [{ nome: 'A', xp: 10 }];
    const novo = addXP(orig, 'A', 5);
    expect(novo[0].xp).toBe(15);
    expect(orig[0].xp).toBe(10);
  });
});
