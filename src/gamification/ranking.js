export function sortRanking(grupos) {
  return [...grupos].sort((a, b) => b.xp - a.xp);
}

export function addXP(grupos, nome, xp) {
  return grupos.map((g) => (g.nome === nome ? { ...g, xp: g.xp + xp } : g));
}
