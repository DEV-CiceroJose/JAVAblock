const base = () => (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const BACKEND_NAO_CONFIGURADO =
  'O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.';

async function adminRequest(path, token, options = {}) {
  if (!base()) return { ok: false, error: BACKEND_NAO_CONFIGURADO };
  try {
    const res = await fetch(`${base()}${path}`, {
      ...options,
      headers: {
        'x-admin-token': token,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    if (res.status === 401) return { ok: false, error: 'Token inválido.' };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || (body.errors ? body.errors.join(' ') : 'Erro ao comunicar com o backend.');
      return { ok: false, error: msg };
    }
    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch {
    return { ok: false, error: BACKEND_NAO_CONFIGURADO };
  }
}

export async function verifyAdminToken(token) {
  const result = await adminRequest('/api/admin/verify', token, { method: 'POST' });
  return { ok: result.ok, error: result.error };
}

export async function listChallengesAdmin(token) {
  return adminRequest('/api/admin/challenges', token);
}

export async function createChallenge(token, data) {
  return adminRequest('/api/admin/challenges', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateChallenge(token, id, patch) {
  return adminRequest(`/api/admin/challenges/${encodeURIComponent(id)}`, token, {
    method: 'PUT',
    body: JSON.stringify(patch)
  });
}

export async function deleteChallenge(token, id) {
  return adminRequest(`/api/admin/challenges/${encodeURIComponent(id)}`, token, { method: 'DELETE' });
}

export async function reorderChallenges(token, order) {
  return adminRequest('/api/admin/challenges/reorder', token, {
    method: 'PUT',
    body: JSON.stringify({ order })
  });
}
