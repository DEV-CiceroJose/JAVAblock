const clone = (v) => JSON.parse(JSON.stringify(v));

const DEFAULT_CONFIG = {
  maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15,
  xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20,
  penalidadeErro: 10, penalidadeProibido: 20
};

export function createMemoryRepo(seed = {}) {
  const state = {
    challenges: clone(seed.challenges || []),
    config: clone(seed.config || DEFAULT_CONFIG),
    groups: clone(seed.groups || []),
    submissions: clone(seed.submissions || [])
  };

  const sortChallenges = (a, b) => (a.modulo - b.modulo) || (a.ordem - b.ordem);

  return {
    async listChallenges() { return clone(state.challenges).sort(sortChallenges); },
    async getChallengeById(id) {
      const c = state.challenges.find((x) => x.id === id);
      return c ? clone(c) : null;
    },
    async createChallenge(challenge) {
      state.challenges.push(clone(challenge));
      return clone(challenge);
    },
    async updateChallenge(id, patch) {
      const i = state.challenges.findIndex((x) => x.id === id);
      if (i === -1) return null;
      state.challenges[i] = { ...state.challenges[i], ...clone(patch), id };
      return clone(state.challenges[i]);
    },
    async deleteChallenge(id) {
      const i = state.challenges.findIndex((x) => x.id === id);
      if (i === -1) return false;
      state.challenges.splice(i, 1);
      return true;
    },
    async getConfig() { return clone(state.config); },
    async setConfig(config) { state.config = { ...state.config, ...clone(config) }; return clone(state.config); },
    async listGroups() { return clone(state.groups); },
    async incrementGroupXp(nome, xp) {
      const g = state.groups.find((x) => x.nome === nome);
      if (g) g.xp += xp;
      else state.groups.push({ nome, xp });
    },
    async addSubmission(submission) {
      const s = { timestamp: Date.now(), ...clone(submission) };
      state.submissions.push(s);
      return clone(s);
    },
    async listSubmissions() { return clone(state.submissions); }
  };
}
