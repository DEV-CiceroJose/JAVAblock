import { describe, it, expect } from 'vitest';
import { BLOCKS, CATEGORIES, getBlock } from '../blocks.js';

describe('blocks', () => {
  it('todo bloco tem id, category, label, template', () => {
    for (const b of BLOCKS) {
      expect(b.id).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.label).toBeTruthy();
      expect(typeof b.template).toBe('string');
    }
  });
  it('ids são únicos', () => {
    const ids = BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('toda category usada existe em CATEGORIES', () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    for (const b of BLOCKS) expect(keys.has(b.category)).toBe(true);
  });
  it('getBlock devolve a definição', () => {
    expect(getBlock('print').label).toContain('println');
  });
});
