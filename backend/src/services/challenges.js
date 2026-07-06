const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);

export function validateChallengeShape(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['payload ausente'] };
  if (!isStr(data.id)) errors.push('id é obrigatório');
  if (!isStr(data.titulo)) errors.push('titulo é obrigatório');
  if (!isStr(data.descricao)) errors.push('descricao é obrigatória');
  if (!isStr(data.objetivoPedagogico)) errors.push('objetivoPedagogico é obrigatório');
  if (!isArr(data.blocosPermitidos)) errors.push('blocosPermitidos deve ser array');
  if (!isArr(data.dicas) || data.dicas.length !== 3) errors.push('dicas deve ter exatamente 3 itens');
  if (typeof data.modulo !== 'number') errors.push('modulo deve ser número');
  if (typeof data.ordem !== 'number') errors.push('ordem deve ser número');
  const r = data.regras;
  if (!r || typeof r !== 'object') errors.push('regras é obrigatória');
  else {
    if (!isArr(r.obrigatorios)) errors.push('regras.obrigatorios deve ser array');
    if (!isArr(r.proibidos)) errors.push('regras.proibidos deve ser array');
    if (!isArr(r.ordem)) errors.push('regras.ordem deve ser array');
    if (typeof r.quantidadeMinima !== 'number') errors.push('regras.quantidadeMinima deve ser número');
  }
  return { valid: errors.length === 0, errors };
}

export async function listChallenges(repo) { return repo.listChallenges(); }
export async function getChallenge(repo, id) { return repo.getChallengeById(id); }

export async function createChallenge(repo, data) {
  const { valid, errors } = validateChallengeShape(data);
  if (!valid) return { ok: false, errors };
  if (await repo.getChallengeById(data.id)) return { ok: false, errors: ['já existe desafio com esse id'] };
  const challenge = await repo.createChallenge(data);
  return { ok: true, challenge };
}

export async function updateChallenge(repo, id, patch) {
  const existing = await repo.getChallengeById(id);
  if (!existing) return { ok: false, notFound: true };
  const merged = { ...existing, ...patch, id };
  const { valid, errors } = validateChallengeShape(merged);
  if (!valid) return { ok: false, errors };
  const challenge = await repo.updateChallenge(id, patch);
  return { ok: true, challenge };
}

export async function deleteChallenge(repo, id) { return repo.deleteChallenge(id); }

export async function reorderChallenges(repo, order) {
  for (const { id, modulo, ordem } of order) {
    await repo.updateChallenge(id, { modulo, ordem });
  }
}
