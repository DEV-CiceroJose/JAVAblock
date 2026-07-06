import { Router } from 'express';
import * as challenges from '../services/challenges.js';
import { getConfig, publicConfig } from '../services/config.js';
import { getRanking } from '../services/ranking.js';
import { recordResult } from '../services/results.js';
import { wrap } from '../middleware/errors.js';

export function registerPublicRoutes(app) {
  const r = Router();
  const repo = () => app.locals.repo;

  r.get('/challenges', wrap(async (req, res) => res.json(await challenges.listChallenges(repo()))));
  r.get('/challenges/:id', wrap(async (req, res) => {
    const c = await challenges.getChallenge(repo(), req.params.id);
    if (!c) return res.status(404).json({ error: 'Desafio não encontrado.' });
    res.json(c);
  }));
  r.get('/config', wrap(async (req, res) => res.json(publicConfig(await getConfig(repo())))));
  r.get('/ranking', wrap(async (req, res) => res.json(await getRanking(repo()))));
  r.post('/results', wrap(async (req, res) => {
    const result = await recordResult(repo(), req.body);
    if (!result.ok) return res.status(400).json({ errors: result.errors });
    res.status(202).json({ ok: true });
  }));

  app.use('/api', r);
}
