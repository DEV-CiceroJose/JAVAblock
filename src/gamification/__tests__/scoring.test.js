import { describe, it, expect } from 'vitest';
import { computeXP, HINT_PENALTY, FIRST_TRY_BONUS } from '../scoring.js';

describe('computeXP', () => {
  it('acerto perfeito na primeira dá base + bônus', () => {
    expect(computeXP({ hintsUsed: 0, wrongAttempts: 0, forbiddenUsed: 0, firstTry: true }))
      .toBe(100 + FIRST_TRY_BONUS + 20); // NO_HINT_BONUS = 20
  });
  it('cada dica reduz a pontuação', () => {
    const semDica = computeXP({ hintsUsed: 0, wrongAttempts: 0, forbiddenUsed: 0, firstTry: false });
    const comDica = computeXP({ hintsUsed: 1, wrongAttempts: 0, forbiddenUsed: 0, firstTry: false });
    expect(semDica - comDica).toBe(HINT_PENALTY);
  });
  it('nunca fica negativo', () => {
    expect(computeXP({ hintsUsed: 99, wrongAttempts: 99, forbiddenUsed: 99, firstTry: false }))
      .toBeGreaterThanOrEqual(0);
  });
});
