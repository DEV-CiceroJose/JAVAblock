import { describe, it, expect } from 'vitest';
import { validate, flatten } from '../validator.js';

const inst = (blockId, children = []) => ({ instanceId: blockId, blockId, fields: {}, children });

const challenge = {
  regras: {
    obrigatorios: ['arraylist_criar', 'arraylist_add', 'try', 'catch'],
    proibidos: ['while'],
    ordem: [['arraylist_criar', 'arraylist_add'], ['try', 'catch']],
    quantidadeMinima: 4
  }
};

describe('flatten', () => {
  it('inclui filhos de containers em ordem', () => {
    const seq = flatten([inst('try', [inst('arraylist_add')]), inst('catch')]);
    expect(seq).toEqual(['try', 'arraylist_add', 'catch']);
  });
});

describe('validate', () => {
  it('reclama de bloco obrigatório faltando, de forma pedagógica', () => {
    const r = validate([inst('arraylist_criar')], challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem).not.toBe('Resposta incorreta.');
    expect(r.mensagem.length).toBeGreaterThan(20);
  });

  it('reclama de bloco proibido', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try', [inst('while')]), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('while');
  });

  it('reclama de ordem errada explicando o que fazer', () => {
    const seq = [inst('arraylist_add'), inst('arraylist_criar'), inst('try'), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('antes');
  });

  it('aprova solução correta', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try'), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(true);
  });

  it('exige catch depois de try (mensagem específica)', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('catch');
  });
});
