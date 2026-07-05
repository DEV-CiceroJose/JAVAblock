import { describe, it, expect } from 'vitest';
import { CHALLENGES, getChallenge } from '../challenges.js';
import { getBlock } from '../blocks.js';

describe('challenges', () => {
  it('tem 2 desafios', () => { expect(CHALLENGES.length).toBe(2); });
  it('todo desafio tem campos pedagógicos', () => {
    for (const c of CHALLENGES) {
      expect(c.titulo).toBeTruthy();
      expect(c.descricao.length).toBeGreaterThan(30);
      expect(c.objetivoPedagogico).toBeTruthy();
      expect(c.dicas.length).toBe(3);
      expect(c.regras.obrigatorios.length).toBeGreaterThan(0);
    }
  });
  it('todos os ids referenciados existem', () => {
    for (const c of CHALLENGES) {
      for (const id of [...c.blocosPermitidos, ...c.regras.obrigatorios, ...c.regras.proibidos]) {
        expect(getBlock(id), `bloco ${id}`).toBeTruthy();
      }
    }
  });
  it('getChallenge funciona', () => {
    expect(getChallenge(CHALLENGES[0].id)).toBe(CHALLENGES[0]);
  });
});
