const base = () => (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function getJson(path) {
  if (!base()) return null;
  try {
    const res = await fetch(`${base()}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchChallenges() { return getJson('/api/challenges'); }
export async function fetchConfig() { return getJson('/api/config'); }
export async function fetchRanking() { return getJson('/api/ranking'); }

export async function submitResult(payload) {
  if (!base()) return;
  try {
    await fetch(`${base()}/api/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    /* fire-and-forget: ignora falhas de rede */
  }
}
