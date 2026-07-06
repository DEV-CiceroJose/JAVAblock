const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNumGte = (v, min) => typeof v === 'number' && !Number.isNaN(v) && v >= min;

export function validateResultPayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['payload ausente'] };
  if (!isStr(data.grupo)) errors.push('grupo é obrigatório');
  if (!isStr(data.challengeId)) errors.push('challengeId é obrigatório');
  if (!isNumGte(data.xp, 0)) errors.push('xp deve ser número >= 0');
  if (!isNumGte(data.dicasUsadas, 0)) errors.push('dicasUsadas deve ser número >= 0');
  if (!isNumGte(data.tentativas, 1)) errors.push('tentativas deve ser número >= 1');
  if (!isNumGte(data.tempoSegundos, 0)) errors.push('tempoSegundos deve ser número >= 0');
  if (typeof data.acertou !== 'boolean') errors.push('acertou deve ser boolean');
  return { valid: errors.length === 0, errors };
}

export async function recordResult(repo, data) {
  const { valid, errors } = validateResultPayload(data);
  if (!valid) return { ok: false, errors };
  const submission = await repo.addSubmission({
    grupo: data.grupo, challengeId: data.challengeId, categoria: data.categoria || 'geral',
    xp: data.xp, dicasUsadas: data.dicasUsadas, tentativas: data.tentativas,
    tempoSegundos: data.tempoSegundos, acertou: data.acertou
  });
  await repo.incrementGroupXp(data.grupo, data.xp);
  return { ok: true, submission };
}
