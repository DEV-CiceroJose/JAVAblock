import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import * as challenges from '../services/challenges.js';
import { getConfig, setConfig } from '../services/config.js';
import { computeDashboard } from '../services/stats.js';

export function registerAdminRoutes(app) {
  const r = Router();
  const repo = () => app.locals.repo;
  r.use(requireAdmin(app.locals.adminToken));

  r.post('/verify', (req, res) => res.json({ ok: true }));

  r.get('/challenges', async (req, res) => res.json(await challenges.listChallenges(repo())));
  r.post('/challenges', async (req, res) => {
    const result = await challenges.createChallenge(repo(), req.body);
    if (!result.ok) return res.status(400).json({ errors: result.errors });
    res.status(201).json(result.challenge);
  });
  r.put('/challenges/reorder', async (req, res) => {
    await challenges.reorderChallenges(repo(), req.body.order || []);
    res.json({ ok: true });
  });
  r.put('/challenges/:id', async (req, res) => {
    const result = await challenges.updateChallenge(repo(), req.params.id, req.body);
    if (result.notFound) return res.status(404).json({ error: 'Desafio não encontrado.' });
    if (!result.ok) return res.status(400).json({ errors: result.errors });
    res.json(result.challenge);
  });
  r.delete('/challenges/:id', async (req, res) => {
    const removed = await challenges.deleteChallenge(repo(), req.params.id);
    if (!removed) return res.status(404).json({ error: 'Desafio não encontrado.' });
    res.json({ ok: true });
  });

  r.get('/config', async (req, res) => res.json(await getConfig(repo())));
  r.put('/config', async (req, res) => res.json(await setConfig(repo(), req.body)));

  r.get('/dashboard', async (req, res) => {
    const [subs, groups] = await Promise.all([repo().listSubmissions(), repo().listGroups()]);
    res.json(computeDashboard(subs, groups));
  });

  app.use('/api/admin', r);
}
