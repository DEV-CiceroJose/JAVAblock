export async function getConfig(repo) { return repo.getConfig(); }
export async function setConfig(repo, patch) { return repo.setConfig(patch); }

export function publicConfig(config) {
  return {
    maxDicas: config.maxDicas,
    penalidadePorDica: config.penalidadePorDica,
    tempoEntreDicasSeg: config.tempoEntreDicasSeg,
    xpBase: config.xpBase,
    bonusPrimeira: config.bonusPrimeira,
    bonusSemDicas: config.bonusSemDicas
  };
}
