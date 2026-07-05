export const BASE_XP = 100;
export const HINT_PENALTY = 15;
export const WRONG_PENALTY = 10;
export const FORBIDDEN_PENALTY = 20;
export const FIRST_TRY_BONUS = 30;
export const NO_HINT_BONUS = 20;

export function computeXP({ hintsUsed = 0, wrongAttempts = 0, forbiddenUsed = 0, firstTry = false }) {
  let xp = BASE_XP;
  xp -= hintsUsed * HINT_PENALTY;
  xp -= wrongAttempts * WRONG_PENALTY;
  xp -= forbiddenUsed * FORBIDDEN_PENALTY;
  if (firstTry && wrongAttempts === 0) xp += FIRST_TRY_BONUS;
  if (firstTry && hintsUsed === 0) xp += NO_HINT_BONUS;
  return Math.max(0, xp);
}
