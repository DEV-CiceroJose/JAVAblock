import express from 'express';
import cors from 'cors';

export function createApp(repo, options = {}) {
  const app = express();
  app.locals.repo = repo;
  app.use(cors(options.corsOrigins?.length ? { origin: options.corsOrigins } : {}));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  return app;
}
