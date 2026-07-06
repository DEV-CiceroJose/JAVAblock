import { describe, it, expect } from 'vitest';
import { computeDashboard } from '../src/services/stats.js';

const subs = [
  { grupo: 'A', categoria: 'excecoes', dicasUsadas: 1, tempoSegundos: 100, acertou: true },
  { grupo: 'A', categoria: 'excecoes', dicasUsadas: 0, tempoSegundos: 200, acertou: false },
  { grupo: 'B', categoria: 'collections', dicasUsadas: 2, tempoSegundos: 60, acertou: true }
];
const groups = [{ nome: 'A', xp: 100 }, { nome: 'B', xp: 150 }];

describe('computeDashboard', () => {
  it('agrega métricas gerais', () => {
    const d = computeDashboard(subs, groups);
    expect(d.ranking[0].nome).toBe('B');
    expect(d.totalConcluidos).toBe(2);          // 2 acertos
    expect(d.tempoMedioSeg).toBe(120);          // (100+200+60)/3
    expect(d.dicasUsadas).toBe(3);
    expect(d.taxaAcerto).toBeCloseTo(2 / 3);
  });
  it('desempenho por categoria em %', () => {
    const d = computeDashboard(subs, groups);
    expect(d.porCategoria.excecoes).toBe(50);   // 1 de 2
    expect(d.porCategoria.collections).toBe(100);
  });
  it('lida com lista vazia sem quebrar', () => {
    const d = computeDashboard([], []);
    expect(d.totalConcluidos).toBe(0);
    expect(d.tempoMedioSeg).toBe(0);
    expect(d.taxaAcerto).toBe(0);
    expect(d.porCategoria).toEqual({});
  });
});
