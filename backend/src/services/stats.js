import { sortRanking } from './ranking.js';

export function computeDashboard(submissions, groups) {
  const total = submissions.length;
  const acertos = submissions.filter((s) => s.acertou).length;
  const somaTempo = submissions.reduce((a, s) => a + (s.tempoSegundos || 0), 0);
  const somaDicas = submissions.reduce((a, s) => a + (s.dicasUsadas || 0), 0);

  const porCategoria = {};
  const buckets = {};
  for (const s of submissions) {
    const cat = s.categoria || 'geral';
    buckets[cat] = buckets[cat] || { total: 0, acertos: 0 };
    buckets[cat].total += 1;
    if (s.acertou) buckets[cat].acertos += 1;
  }
  for (const [cat, b] of Object.entries(buckets)) {
    porCategoria[cat] = Math.round((b.acertos / b.total) * 100);
  }

  return {
    ranking: sortRanking(groups),
    totalConcluidos: acertos,
    tempoMedioSeg: total ? Math.round(somaTempo / total) : 0,
    dicasUsadas: somaDicas,
    taxaAcerto: total ? acertos / total : 0,
    porCategoria
  };
}
