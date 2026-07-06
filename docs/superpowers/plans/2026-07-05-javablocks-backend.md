# JavaBlocks — Fase 2: Backend + Firebase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o backend REST do JavaBlocks (Express + Firestore + auth por token) que serve desafios, recebe resultados dos alunos e expõe autoria + dashboard ao professor — mais a fiação mínima do app do aluno (fetch com fallback local + envio de resultado).

**Architecture:** App Node independente em `backend/`. Camadas: rotas → controllers → services (lógica pura) → repository (único ponto que fala com o Firestore). Toda a lógica de negócio recebe o `repository` por injeção, então os testes rodam com um repository fake em memória e nunca tocam no Firestore real. O app do aluno ganha um `services/api.js` fino que degrada para o comportamento local quando não há backend.

**Tech Stack:** Node 18+, Express 4, firebase-admin, Vitest, supertest. App do aluno: React/Vite (já existente).

## Global Constraints

- JavaScript moderno ESM (`"type": "module"`), sem TypeScript.
- Toda lógica de negócio em `services/` é pura e recebe `repository` por parâmetro — nunca importa o Firestore diretamente.
- Endpoints do aluno (`GET /api/challenges`, `/config`, `/ranking`, `POST /api/results`) são PÚBLICOS. Endpoints `/api/admin/*` exigem header `x-admin-token` igual à env `ADMIN_TOKEN`.
- Nunca expor credenciais Firebase nem `ADMIN_TOKEN` no cliente. `firebase-admin` roda só no servidor.
- App do aluno: sem `VITE_API_URL` setada, comportamento IDÊNTICO ao atual (100% local). Toda chamada de rede usa `try/catch` e degrada silenciosamente.
- Forma do desafio (idêntica a `src/data/challenges.js`): `{ id, titulo, descricao, objetivoPedagogico, blocosPermitidos: string[], regras: { obrigatorios: string[], proibidos: string[], ordem: [string,string][], quantidadeMinima: number }, dicas: string[] (exatamente 3) }` + `modulo: number`, `ordem: number` (sequenciamento).
- Testes rodam a partir de `backend/` com `npm test` (Vitest). O front do aluno mantém seus 26 testes.

---

## Interface do Repository (contrato compartilhado por todas as tasks)

Todos os métodos são assíncronos (`Promise`). O repository fake (Task 1) e o repository Firestore (Task 8) implementam EXATAMENTE esta interface:

```
listChallenges()            -> Challenge[]                (ordenados por modulo, ordem)
getChallengeById(id)        -> Challenge | null
createChallenge(challenge)  -> Challenge                  (o objeto salvo)
updateChallenge(id, patch)  -> Challenge | null           (null se não existe)
deleteChallenge(id)         -> boolean                    (true se removeu)
getConfig()                 -> Config
setConfig(config)           -> Config
listGroups()                -> Group[]                    ({ nome, xp })
incrementGroupXp(nome, xp)  -> void                       (soma xp ao grupo; cria se não existe)
addSubmission(submission)   -> Submission
listSubmissions()           -> Submission[]
```

Tipos:
- `Challenge` — a forma acima.
- `Config` — `{ maxDicas, penalidadePorDica, tempoEntreDicasSeg, xpBase, bonusPrimeira, bonusSemDicas, penalidadeErro, penalidadeProibido }`.
- `Group` — `{ nome: string, xp: number }`.
- `Submission` — `{ grupo, challengeId, categoria, xp, dicasUsadas, tentativas, tempoSegundos, acertou, timestamp }`.

---

## Task 1: Scaffold do backend + repository fake

**Files:**
- Create: `backend/package.json`, `backend/vitest.config.js`, `backend/.gitignore`, `backend/.env.example`
- Create: `backend/src/config/env.js`, `backend/src/app.js`, `backend/src/index.js`
- Create: `backend/src/repository/memoryRepo.js`
- Test: `backend/tests/memoryRepo.test.js`, `backend/tests/health.test.js`

**Interfaces:**
- Produces: `createApp(repo)` (factory que devolve o app Express, com o repo injetado em `app.locals.repo`); `createMemoryRepo(seed?)` implementando a interface do repository; `loadEnv()` lendo `ADMIN_TOKEN`, `PORT`, `CORS_ORIGINS`.

- [ ] **Step 1: Criar `backend/package.json`**

```json
{
  "name": "javablocks-backend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "vitest run",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "firebase-admin": "^12.3.1"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Criar configs**

`backend/vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

`backend/.gitignore`:
```
node_modules/
.env
```

`backend/.env.example`:
```
ADMIN_TOKEN=troque-este-token
PORT=4000
CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`backend/src/config/env.js`:
```js
export function loadEnv(source = process.env) {
  return {
    adminToken: source.ADMIN_TOKEN || '',
    port: Number(source.PORT) || 4000,
    corsOrigins: (source.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  };
}
```

- [ ] **Step 3: Escrever o teste do memoryRepo**

`backend/tests/memoryRepo.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

describe('memoryRepo', () => {
  it('cria e lista desafios', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const list = await repo.listChallenges();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('c1');
  });

  it('não vaza referência mutável', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const list = await repo.listChallenges();
    list[0].titulo = 'MUTADO';
    const again = await repo.listChallenges();
    expect(again[0].titulo).toBe('T');
  });

  it('atualiza e remove', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const up = await repo.updateChallenge('c1', { titulo: 'Novo' });
    expect(up.titulo).toBe('Novo');
    expect(await repo.deleteChallenge('c1')).toBe(true);
    expect(await repo.getChallengeById('c1')).toBeNull();
  });

  it('incrementa xp do grupo e adiciona submission', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 10 }] });
    await repo.incrementGroupXp('A', 5);
    const groups = await repo.listGroups();
    expect(groups.find((g) => g.nome === 'A').xp).toBe(15);
    await repo.addSubmission({ grupo: 'A', challengeId: 'c1', xp: 5, acertou: true });
    expect(await repo.listSubmissions()).toHaveLength(1);
  });

  it('incrementGroupXp cria grupo inexistente', async () => {
    const repo = createMemoryRepo();
    await repo.incrementGroupXp('Novo', 7);
    expect((await repo.listGroups()).find((g) => g.nome === 'Novo').xp).toBe(7);
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `cd backend && npm install && npm test -- memoryRepo`
Expected: FAIL (módulo não existe).

- [ ] **Step 5: Implementar `backend/src/repository/memoryRepo.js`**

```js
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
```

- [ ] **Step 6: Escrever o teste do healthcheck**

`backend/tests/health.test.js`:
```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

describe('health', () => {
  it('GET /api/health responde 200', async () => {
    const app = createApp(createMemoryRepo());
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `cd backend && npm test -- health`
Expected: FAIL (`createApp` não existe).

- [ ] **Step 8: Implementar `backend/src/app.js` e `backend/src/index.js`**

`backend/src/app.js`:
```js
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
```

`backend/src/index.js`:
```js
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMemoryRepo } from './repository/memoryRepo.js';

const env = loadEnv();
// A troca para o repository Firestore acontece na Task 8.
const repo = createMemoryRepo();
const app = createApp(repo, { corsOrigins: env.corsOrigins });
app.listen(env.port, () => console.log(`JavaBlocks backend na porta ${env.port}`));
```

- [ ] **Step 9: Rodar e ver passar**

Run: `cd backend && npm test`
Expected: PASS (memoryRepo + health).

- [ ] **Step 10: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): scaffold Express + repository fake em memória"
```

---

## Task 2: Service de desafios (validação + CRUD, injetado)

**Files:**
- Create: `backend/src/services/challenges.js`
- Test: `backend/tests/challenges.service.test.js`

**Interfaces:**
- Consumes: interface do repository (Task 1).
- Produces:
  - `validateChallengeShape(data) -> { valid: boolean, errors: string[] }` (puro)
  - `listChallenges(repo) -> Challenge[]`
  - `getChallenge(repo, id) -> Challenge | null`
  - `createChallenge(repo, data) -> { ok: true, challenge } | { ok: false, errors }`
  - `updateChallenge(repo, id, patch) -> { ok: true, challenge } | { ok: false, errors } | { ok: false, notFound: true }`
  - `deleteChallenge(repo, id) -> boolean`
  - `reorderChallenges(repo, order) -> void` (`order` = array de `{ id, modulo, ordem }`)

- [ ] **Step 1: Escrever o teste**

`backend/tests/challenges.service.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import * as svc from '../src/services/challenges.js';

const valido = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [['try', 'catch']], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

describe('validateChallengeShape', () => {
  it('aceita desafio válido', () => {
    expect(svc.validateChallengeShape(valido).valid).toBe(true);
  });
  it('rejeita id ausente', () => {
    const r = svc.validateChallengeShape({ ...valido, id: undefined });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/id/);
  });
  it('exige exatamente 3 dicas', () => {
    const r = svc.validateChallengeShape({ ...valido, dicas: ['só uma'] });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/dicas/);
  });
  it('exige regras.obrigatorios como array', () => {
    const r = svc.validateChallengeShape({ ...valido, regras: { ...valido.regras, obrigatorios: 'x' } });
    expect(r.valid).toBe(false);
  });
});

describe('CRUD de desafios', () => {
  it('cria válido e recusa inválido', async () => {
    const repo = createMemoryRepo();
    const ok = await svc.createChallenge(repo, valido);
    expect(ok.ok).toBe(true);
    const bad = await svc.createChallenge(repo, { ...valido, id: '' });
    expect(bad.ok).toBe(false);
    expect(await svc.listChallenges(repo)).toHaveLength(1);
  });
  it('update de inexistente devolve notFound', async () => {
    const repo = createMemoryRepo();
    const r = await svc.updateChallenge(repo, 'nope', { titulo: 'x' });
    expect(r.ok).toBe(false);
    expect(r.notFound).toBe(true);
  });
  it('reorder atualiza modulo/ordem', async () => {
    const repo = createMemoryRepo();
    await svc.createChallenge(repo, valido);
    await svc.createChallenge(repo, { ...valido, id: 'c2', modulo: 1, ordem: 2 });
    await svc.reorderChallenges(repo, [{ id: 'c2', modulo: 1, ordem: 1 }, { id: 'c1', modulo: 1, ordem: 2 }]);
    const list = await svc.listChallenges(repo);
    expect(list[0].id).toBe('c2');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- challenges.service`
Expected: FAIL.

- [ ] **Step 3: Implementar `backend/src/services/challenges.js`**

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npm test -- challenges.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): service de desafios com validação de forma"
```

---

## Task 3: Middleware de auth + service de config

**Files:**
- Create: `backend/src/middleware/auth.js`, `backend/src/services/config.js`
- Test: `backend/tests/auth.test.js`, `backend/tests/config.service.test.js`

**Interfaces:**
- Produces:
  - `requireAdmin(expectedToken) -> (req, res, next)` — 401 se `x-admin-token` ausente/errado.
  - `getConfig(repo) -> Config`; `setConfig(repo, patch) -> Config`; `publicConfig(config) -> subconjunto do aluno`.

- [ ] **Step 1: Escrever os testes**

`backend/tests/auth.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../src/middleware/auth.js';

function fakeRes() {
  return { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
}

describe('requireAdmin', () => {
  it('chama next com token correto', () => {
    const mw = requireAdmin('segredo');
    let called = false;
    mw({ headers: { 'x-admin-token': 'segredo' } }, fakeRes(), () => { called = true; });
    expect(called).toBe(true);
  });
  it('401 com token errado', () => {
    const mw = requireAdmin('segredo');
    const res = fakeRes();
    let called = false;
    mw({ headers: { 'x-admin-token': 'errado' } }, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });
  it('401 sem token', () => {
    const mw = requireAdmin('segredo');
    const res = fakeRes();
    mw({ headers: {} }, res, () => {});
    expect(res.statusCode).toBe(401);
  });
});
```

`backend/tests/config.service.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { getConfig, setConfig, publicConfig } from '../src/services/config.js';

describe('config service', () => {
  it('lê config default', async () => {
    const repo = createMemoryRepo();
    const c = await getConfig(repo);
    expect(c.maxDicas).toBe(3);
  });
  it('setConfig faz merge', async () => {
    const repo = createMemoryRepo();
    const c = await setConfig(repo, { maxDicas: 5 });
    expect(c.maxDicas).toBe(5);
    expect(c.xpBase).toBe(100);
  });
  it('publicConfig só expõe campos do aluno', () => {
    const pub = publicConfig({ maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15,
      xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20, penalidadeErro: 10, penalidadeProibido: 20 });
    expect(pub.maxDicas).toBe(3);
    expect(pub.tempoEntreDicasSeg).toBe(15);
    expect(pub).not.toHaveProperty('penalidadeProibido');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- auth config.service`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`backend/src/middleware/auth.js`:
```js
export function requireAdmin(expectedToken) {
  return (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token || token !== expectedToken) {
      return res.status(401).json({ error: 'Token inválido ou ausente.' });
    }
    next();
  };
}
```

`backend/src/services/config.js`:
```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npm test -- auth config.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): middleware de auth por token + service de config"
```

---

## Task 4: Services de resultados e ranking

**Files:**
- Create: `backend/src/services/results.js`, `backend/src/services/ranking.js`
- Test: `backend/tests/results.service.test.js`, `backend/tests/ranking.service.test.js`

**Interfaces:**
- Produces:
  - `validateResultPayload(data) -> { valid, errors }` (puro)
  - `recordResult(repo, data) -> { ok: true, submission } | { ok: false, errors }`
  - `getRanking(repo) -> Group[]` (ordenado por xp desc)
  - `sortRanking(groups) -> Group[]` (puro, não muta)

- [ ] **Step 1: Escrever os testes**

`backend/tests/results.service.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { validateResultPayload, recordResult } from '../src/services/results.js';

const payload = { grupo: 'A', challengeId: 'c1', categoria: 'excecoes', xp: 120,
  dicasUsadas: 0, tentativas: 1, tempoSegundos: 90, acertou: true };

describe('validateResultPayload', () => {
  it('aceita payload válido', () => { expect(validateResultPayload(payload).valid).toBe(true); });
  it('rejeita grupo ausente', () => { expect(validateResultPayload({ ...payload, grupo: '' }).valid).toBe(false); });
  it('rejeita xp negativo', () => { expect(validateResultPayload({ ...payload, xp: -5 }).valid).toBe(false); });
  it('rejeita acertou não-boolean', () => { expect(validateResultPayload({ ...payload, acertou: 'sim' }).valid).toBe(false); });
});

describe('recordResult', () => {
  it('grava submission e incrementa xp do grupo', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 0 }] });
    const r = await recordResult(repo, payload);
    expect(r.ok).toBe(true);
    expect((await repo.listGroups()).find((g) => g.nome === 'A').xp).toBe(120);
    expect(await repo.listSubmissions()).toHaveLength(1);
  });
  it('payload inválido não grava nada', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 0 }] });
    const r = await recordResult(repo, { ...payload, grupo: '' });
    expect(r.ok).toBe(false);
    expect(await repo.listSubmissions()).toHaveLength(0);
    expect((await repo.listGroups()).find((g) => g.nome === 'A').xp).toBe(0);
  });
});
```

`backend/tests/ranking.service.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { getRanking, sortRanking } from '../src/services/ranking.js';

describe('ranking', () => {
  it('sortRanking ordena por xp desc sem mutar', () => {
    const orig = [{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }, { nome: 'C', xp: 20 }];
    const sorted = sortRanking(orig);
    expect(sorted.map((g) => g.nome)).toEqual(['B', 'C', 'A']);
    expect(orig[0].nome).toBe('A');
  });
  it('getRanking lê do repo ordenado', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }] });
    const r = await getRanking(repo);
    expect(r[0].nome).toBe('B');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- results.service ranking.service`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`backend/src/services/results.js`:
```js
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
```

`backend/src/services/ranking.js`:
```js
export function sortRanking(groups) {
  return [...groups].sort((a, b) => b.xp - a.xp);
}
export async function getRanking(repo) {
  return sortRanking(await repo.listGroups());
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npm test -- results.service ranking.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): services de resultados e ranking"
```

---

## Task 5: Service de estatísticas (dashboard)

**Files:**
- Create: `backend/src/services/stats.js`
- Test: `backend/tests/stats.service.test.js`

**Interfaces:**
- Consumes: `sortRanking` (Task 4).
- Produces: `computeDashboard(submissions, groups) -> { ranking, totalConcluidos, tempoMedioSeg, dicasUsadas, taxaAcerto, porCategoria }`. `porCategoria` = `{ [categoria]: percentualAcerto }`. Puro.

- [ ] **Step 1: Escrever o teste**

`backend/tests/stats.service.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { computeDashboard } from '../src/services/stats.js';

const subs = [
  { grupo: 'A', categoria: 'excecoes', dicasUsadas: 1, tempoSegundos: 100, acertou: true },
  { grupo: 'A', categoria: 'excecoes', dicasUsadas: 0, tempoSegundos: 200, acertou: false },
  { grupo: 'B', categoria: 'collections', dicasUsadas: 2, tempoSegundos: 60, acertou: true }
];
const groups = [{ nome: 'A', xp: 100 }, { nome: 'B', xp: 150 }];

describe('computeDashboard', () => {
  it('agrega métricas gerais', () => {
    const d = computeDashboard(subs, groups);
    expect(d.ranking[0].nome).toBe('B');
    expect(d.totalConcluidos).toBe(2);          // 2 acertos
    expect(d.tempoMedioSeg).toBe(120);          // (100+200+60)/3
    expect(d.dicasUsadas).toBe(3);
    expect(d.taxaAcerto).toBeCloseTo(2 / 3);
  });
  it('desempenho por categoria em %', () => {
    const d = computeDashboard(subs, groups);
    expect(d.porCategoria.excecoes).toBe(50);   // 1 de 2
    expect(d.porCategoria.collections).toBe(100);
  });
  it('lida com lista vazia sem quebrar', () => {
    const d = computeDashboard([], []);
    expect(d.totalConcluidos).toBe(0);
    expect(d.tempoMedioSeg).toBe(0);
    expect(d.taxaAcerto).toBe(0);
    expect(d.porCategoria).toEqual({});
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- stats.service`
Expected: FAIL.

- [ ] **Step 3: Implementar `backend/src/services/stats.js`**

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npm test -- stats.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): service de estatísticas do dashboard"
```

---

## Task 6: Rotas públicas (HTTP)

**Files:**
- Create: `backend/src/routes/public.js`
- Modify: `backend/src/app.js` (montar as rotas)
- Test: `backend/tests/public.routes.test.js`

**Interfaces:**
- Consumes: services de challenges/config/ranking/results; `req.app.locals.repo`.
- Produces: `registerPublicRoutes(app)`. Endpoints: `GET /api/challenges`, `GET /api/challenges/:id`, `GET /api/config`, `GET /api/ranking`, `POST /api/results`.

- [ ] **Step 1: Escrever o teste**

`backend/tests/public.routes.test.js`:
```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

function app() {
  return createApp(createMemoryRepo({ challenges: [challenge], groups: [{ nome: 'A', xp: 0 }] }));
}

describe('rotas públicas', () => {
  it('GET /api/challenges lista', async () => {
    const res = await request(app()).get('/api/challenges');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
  it('GET /api/challenges/:id devolve 404 se não existe', async () => {
    const res = await request(app()).get('/api/challenges/nope');
    expect(res.status).toBe(404);
  });
  it('GET /api/config expõe só campos do aluno', async () => {
    const res = await request(app()).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.maxDicas).toBe(3);
    expect(res.body).not.toHaveProperty('penalidadeProibido');
  });
  it('GET /api/ranking ordena por xp', async () => {
    const a = createApp(createMemoryRepo({ groups: [{ nome: 'A', xp: 5 }, { nome: 'B', xp: 9 }] }));
    const res = await request(a).get('/api/ranking');
    expect(res.body[0].nome).toBe('B');
  });
  it('POST /api/results aceita válido (202) e incrementa', async () => {
    const a = app();
    const res = await request(a).post('/api/results')
      .send({ grupo: 'A', challengeId: 'c1', xp: 50, dicasUsadas: 0, tentativas: 1, tempoSegundos: 10, acertou: true });
    expect(res.status).toBe(202);
    const rank = await request(a).get('/api/ranking');
    expect(rank.body.find((g) => g.nome === 'A').xp).toBe(50);
  });
  it('POST /api/results rejeita inválido (400)', async () => {
    const res = await request(app()).post('/api/results').send({ grupo: '' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- public.routes`
Expected: FAIL.

- [ ] **Step 3: Implementar `backend/src/routes/public.js`**

```js
import { Router } from 'express';
import * as challenges from '../services/challenges.js';
import { getConfig, publicConfig } from '../services/config.js';
import { getRanking } from '../services/ranking.js';
import { recordResult } from '../services/results.js';

export function registerPublicRoutes(app) {
  const r = Router();
  const repo = () => app.locals.repo;

  r.get('/challenges', async (req, res) => res.json(await challenges.listChallenges(repo())));
  r.get('/challenges/:id', async (req, res) => {
    const c = await challenges.getChallenge(repo(), req.params.id);
    if (!c) return res.status(404).json({ error: 'Desafio não encontrado.' });
    res.json(c);
  });
  r.get('/config', async (req, res) => res.json(publicConfig(await getConfig(repo()))));
  r.get('/ranking', async (req, res) => res.json(await getRanking(repo())));
  r.post('/results', async (req, res) => {
    const result = await recordResult(repo(), req.body);
    if (!result.ok) return res.status(400).json({ errors: result.errors });
    res.status(202).json({ ok: true });
  });

  app.use('/api', r);
}
```

- [ ] **Step 4: Montar em `backend/src/app.js`**

Modificar `createApp` para chamar as rotas depois do healthcheck. Substituir o corpo de `createApp` por:
```js
import express from 'express';
import cors from 'cors';
import { registerPublicRoutes } from './routes/public.js';

export function createApp(repo, options = {}) {
  const app = express();
  app.locals.repo = repo;
  app.use(cors(options.corsOrigins?.length ? { origin: options.corsOrigins } : {}));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  registerPublicRoutes(app);
  app.locals.adminToken = options.adminToken || '';

  return app;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend && npm test`
Expected: PASS (todos os testes até aqui).

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): rotas públicas (desafios, config, ranking, resultados)"
```

---

## Task 7: Rotas admin (HTTP) protegidas por token

**Files:**
- Create: `backend/src/routes/admin.js`
- Modify: `backend/src/app.js` (montar rotas admin + passar adminToken)
- Test: `backend/tests/admin.routes.test.js`

**Interfaces:**
- Consumes: `requireAdmin` (Task 3), services de challenges/config/stats, `app.locals.adminToken`.
- Produces: `registerAdminRoutes(app)`. Endpoints sob `/api/admin`: `POST /verify`, `GET /challenges`, `POST /challenges`, `PUT /challenges/:id`, `DELETE /challenges/:id`, `PUT /challenges/reorder`, `GET /config`, `PUT /config`, `GET /dashboard`.

- [ ] **Step 1: Escrever o teste**

`backend/tests/admin.routes.test.js`:
```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const TOKEN = 'segredo';
const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

function app(seed) {
  return createApp(createMemoryRepo(seed), { adminToken: TOKEN });
}
const auth = (req) => req.set('x-admin-token', TOKEN);

describe('rotas admin', () => {
  it('bloqueia sem token', async () => {
    const res = await request(app()).get('/api/admin/challenges');
    expect(res.status).toBe(401);
  });
  it('verify aceita token correto', async () => {
    const res = await auth(request(app()).post('/api/admin/verify'));
    expect(res.status).toBe(200);
  });
  it('cria desafio válido (201) e recusa inválido (400)', async () => {
    const a = app();
    const ok = await auth(request(a).post('/api/admin/challenges')).send(challenge);
    expect(ok.status).toBe(201);
    const bad = await auth(request(a).post('/api/admin/challenges')).send({ ...challenge, id: '' });
    expect(bad.status).toBe(400);
  });
  it('update de inexistente 404', async () => {
    const res = await auth(request(app()).put('/api/admin/challenges/nope')).send({ titulo: 'x' });
    expect(res.status).toBe(404);
  });
  it('delete remove (200)', async () => {
    const res = await auth(request(app({ challenges: [challenge] })).delete('/api/admin/challenges/c1'));
    expect(res.status).toBe(200);
  });
  it('PUT /config faz merge', async () => {
    const res = await auth(request(app()).put('/api/admin/config')).send({ maxDicas: 5 });
    expect(res.status).toBe(200);
    expect(res.body.maxDicas).toBe(5);
  });
  it('GET /dashboard agrega', async () => {
    const seed = { groups: [{ nome: 'A', xp: 10 }],
      submissions: [{ grupo: 'A', categoria: 'excecoes', dicasUsadas: 1, tempoSegundos: 100, acertou: true }] };
    const res = await auth(request(app(seed)).get('/api/admin/dashboard'));
    expect(res.status).toBe(200);
    expect(res.body.totalConcluidos).toBe(1);
    expect(res.body.porCategoria.excecoes).toBe(100);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- admin.routes`
Expected: FAIL.

- [ ] **Step 3: Implementar `backend/src/routes/admin.js`**

```js
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
```

Nota de ordem: `PUT /challenges/reorder` é registrado ANTES de `PUT /challenges/:id` para não ser capturado como `:id = "reorder"`.

- [ ] **Step 4: Montar em `backend/src/app.js`**

Adicionar o import e a chamada em `createApp` (depois de `registerPublicRoutes`):
```js
import { registerAdminRoutes } from './routes/admin.js';
// ...dentro de createApp, após registerPublicRoutes(app) e após definir app.locals.adminToken:
registerAdminRoutes(app);
```
(Garanta que `app.locals.adminToken` é definido ANTES de `registerAdminRoutes(app)`, pois o middleware captura o token na montagem.)

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend && npm test`
Expected: PASS (suíte inteira).

- [ ] **Step 6: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): rotas admin protegidas por token (CRUD, config, dashboard)"
```

---

## Task 8: Repository Firestore + script de seed

**Files:**
- Create: `backend/src/config/firebase.js`, `backend/src/repository/firestoreRepo.js`, `backend/scripts/seed.js`
- Modify: `backend/src/index.js` (usar Firestore quando houver credenciais)
- Test: `backend/tests/repoInterface.test.js`

**Interfaces:**
- Consumes: interface do repository. Produces: `createFirestoreRepo(db)` com os MESMOS métodos do memoryRepo; `initFirestore(env)` devolvendo `db` (ou `null` se sem credenciais); `seed()`.

- [ ] **Step 1: Escrever o teste de conformidade de interface**

Este teste garante que o firestoreRepo expõe exatamente os mesmos métodos do memoryRepo (sem tocar no Firestore real — usa um `db` fake mínimo).

`backend/tests/repoInterface.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { createFirestoreRepo } from '../src/repository/firestoreRepo.js';

// db fake: só precisa existir para o factory montar o objeto.
const fakeDb = { collection: () => ({ doc: () => ({}), get: async () => ({ docs: [] }) }) };

describe('conformidade de interface do repository', () => {
  it('firestoreRepo expõe os mesmos métodos do memoryRepo', () => {
    const mem = createMemoryRepo();
    const fs = createFirestoreRepo(fakeDb);
    const memMethods = Object.keys(mem).sort();
    const fsMethods = Object.keys(fs).sort();
    expect(fsMethods).toEqual(memMethods);
    for (const m of memMethods) expect(typeof fs[m]).toBe('function');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test -- repoInterface`
Expected: FAIL.

- [ ] **Step 3: Implementar `backend/src/config/firebase.js`**

```js
import admin from 'firebase-admin';

export function initFirestore(env = process.env) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return null;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  }
  return admin.firestore();
}
```

- [ ] **Step 4: Implementar `backend/src/repository/firestoreRepo.js`**

```js
import admin from 'firebase-admin';

const CONFIG_DOC = 'global';

export function createFirestoreRepo(db) {
  const col = (name) => db.collection(name);

  return {
    async listChallenges() {
      const snap = await col('challenges').get();
      return snap.docs.map((d) => d.data())
        .sort((a, b) => (a.modulo - b.modulo) || (a.ordem - b.ordem));
    },
    async getChallengeById(id) {
      const doc = await col('challenges').doc(id).get();
      return doc.exists ? doc.data() : null;
    },
    async createChallenge(challenge) {
      await col('challenges').doc(challenge.id).set(challenge);
      return challenge;
    },
    async updateChallenge(id, patch) {
      const ref = col('challenges').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      const merged = { ...doc.data(), ...patch, id };
      await ref.set(merged);
      return merged;
    },
    async deleteChallenge(id) {
      const ref = col('challenges').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return false;
      await ref.delete();
      return true;
    },
    async getConfig() {
      const doc = await col('config').doc(CONFIG_DOC).get();
      return doc.exists ? doc.data() : {};
    },
    async setConfig(patch) {
      const ref = col('config').doc(CONFIG_DOC);
      const doc = await ref.get();
      const merged = { ...(doc.exists ? doc.data() : {}), ...patch };
      await ref.set(merged);
      return merged;
    },
    async listGroups() {
      const snap = await col('groups').get();
      return snap.docs.map((d) => d.data());
    },
    async incrementGroupXp(nome, xp) {
      await col('groups').doc(nome).set(
        { nome, xp: admin.firestore.FieldValue.increment(xp) },
        { merge: true }
      );
    },
    async addSubmission(submission) {
      const s = { timestamp: Date.now(), ...submission };
      await col('submissions').add(s);
      return s;
    },
    async listSubmissions() {
      const snap = await col('submissions').get();
      return snap.docs.map((d) => d.data());
    }
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend && npm test -- repoInterface`
Expected: PASS (mesmos nomes de método). Rodar `npm test` completo para garantir que nada quebrou.

- [ ] **Step 6: Trocar o repo no `index.js` quando houver credenciais**

`backend/src/index.js`:
```js
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMemoryRepo } from './repository/memoryRepo.js';
import { createFirestoreRepo } from './repository/firestoreRepo.js';
import { initFirestore } from './config/firebase.js';

const env = loadEnv();
const db = initFirestore();
const repo = db ? createFirestoreRepo(db) : createMemoryRepo();
if (!db) console.warn('Sem credenciais Firebase — usando repository em memória (dados voláteis).');

const app = createApp(repo, { corsOrigins: env.corsOrigins, adminToken: env.adminToken });
app.listen(env.port, () => console.log(`JavaBlocks backend na porta ${env.port}`));
```

- [ ] **Step 7: Implementar `backend/scripts/seed.js`**

Semeia os 2 desafios atuais, a config default e os 4 grupos. Copiar a forma dos desafios de `../../src/data/challenges.js` (mesma do app do aluno) adicionando `modulo`/`ordem`.

```js
import { initFirestore } from '../src/config/firebase.js';
import { createFirestoreRepo } from '../src/repository/firestoreRepo.js';

const DESAFIOS = [
  { id: 'cadastro-seguro', modulo: 1, ordem: 1, titulo: 'Cadastro Seguro de Alunos',
    descricao: 'A secretaria da escola precisa de um programa que guarde o nome de alguns alunos e salve essa lista em um arquivo. Como a pessoa pode digitar algo errado, o programa não pode quebrar: use try, catch e finally para proteger. Crie uma lista com ArrayList, adicione alguns nomes e, por fim, escreva a lista no arquivo alunos.txt usando FileWriter e BufferedWriter.',
    objetivoPedagogico: 'Integrar Collections (ArrayList), Tratamento de Exceções e escrita de Arquivos.',
    blocosPermitidos: ['var_string','print','arraylist_criar','arraylist_add','arraylist_mostrar','try','catch','finally','throw','filewriter','bufferedwriter','escrever_arquivo','fechar_arquivo','hashset_criar'],
    regras: { obrigatorios: ['arraylist_criar','arraylist_add','try','catch','filewriter','escrever_arquivo'], proibidos: [], ordem: [['arraylist_criar','arraylist_add'],['try','catch'],['filewriter','escrever_arquivo']], quantidadeMinima: 6 },
    dicas: ['Pense em três etapas: guardar os nomes, proteger contra erros e salvar em arquivo.','Você provavelmente vai usar: Criar Lista, Adicionar Elemento, try, catch, FileWriter e Escrever Arquivo.','A ordem costuma ser: criar a lista → adicionar nomes → abrir o try → escrever no arquivo dentro do try → catch para tratar o erro.'] },
  { id: 'relatorio-notas', modulo: 1, ordem: 2, titulo: 'Relatório de Notas',
    descricao: 'O professor guardou as notas dos alunos em um arquivo chamado notas.txt. Monte um programa que leia esse arquivo com BufferedReader (protegido por try e catch, porque o arquivo pode não existir), guarde cada aluno e sua nota em um HashMap e, no final, mostre o mapa completo na tela com System.out.println().',
    objetivoPedagogico: 'Integrar leitura de Arquivos, Tratamento de Exceções e Collections (HashMap).',
    blocosPermitidos: ['var_string','print','filereader','bufferedreader','ler_linha','try','catch','finally','hashmap_criar','hashmap_add','hashmap_buscar','hashmap_mostrar','fechar_arquivo','arraylist_criar'],
    regras: { obrigatorios: ['try','catch','bufferedreader','ler_linha','hashmap_criar','hashmap_add','hashmap_mostrar'], proibidos: [], ordem: [['try','catch'],['bufferedreader','ler_linha'],['hashmap_criar','hashmap_add'],['hashmap_add','hashmap_mostrar']], quantidadeMinima: 6 },
    dicas: ['Você precisa ler de um arquivo, guardar pares nome→nota e mostrar tudo no final.','Blocos prováveis: try, catch, BufferedReader, Ler Linha, Criar Mapa, Adicionar Chave/Valor e Mostrar Mapa.','Ordem comum: criar o mapa → abrir try → BufferedReader → Ler Linha → adicionar no mapa → catch → mostrar o mapa.'] }
];
const CONFIG = { maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15, xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20, penalidadeErro: 10, penalidadeProibido: 20 };
const GRUPOS = ['ByteMasters', 'Java Warriors', 'NullPointer', 'Compiladores'];

async function seed() {
  const db = initFirestore();
  if (!db) { console.error('Sem credenciais Firebase. Configure o .env antes de semear.'); process.exit(1); }
  const repo = createFirestoreRepo(db);
  for (const d of DESAFIOS) await repo.createChallenge(d);
  await repo.setConfig(CONFIG);
  for (const nome of GRUPOS) await repo.incrementGroupXp(nome, 0);
  console.log('Seed concluído: desafios, config e grupos.');
  process.exit(0);
}
seed();
```

- [ ] **Step 8: Commit**

```bash
cd backend && git add -A && git commit -m "feat(backend): repository Firestore + init firebase + script de seed"
```

---

## Task 9: README do backend + exemplo de env

**Files:**
- Create: `backend/README.md`
- Modify: `README.md` (raiz — apontar para o backend)

**Interfaces:** documentação; sem código.

- [ ] **Step 1: Escrever `backend/README.md`**

Conteúdo (Português): descrição do backend; requisitos (Node 18+); `npm install`, `npm test`, `npm start`, `npm run dev`; tabela de variáveis de ambiente (`ADMIN_TOKEN`, `PORT`, `CORS_ORIGINS`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`); passo a passo do Firebase (criar projeto, ativar Firestore, gerar service account, extrair as 3 credenciais, cuidado com `\n` na private key); como rodar `npm run seed`; lista dos endpoints (públicos e admin, com exemplo de header `x-admin-token`); deploy na Render (Web Service, build `npm install`, start `npm start`, setar env vars); nota de que sem credenciais o backend sobe em modo memória (volátil) para testes locais.

- [ ] **Step 2: Atualizar `README.md` da raiz**

Adicionar uma seção "Backend (Fase 2)" apontando para `backend/README.md` e explicando a relação (app do aluno busca desafios do backend com fallback local via `VITE_API_URL`).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: README do backend (setup, env, Firebase, Render, seed)"
```

---

## Task 10: Fiação do app do aluno (fetch com fallback + envio de resultado)

**Files:**
- Create: `src/services/api.js` (na raiz — app do aluno), `src/services/__tests__/api.test.js`
- Modify: `src/context/ChallengeContext.jsx` (fetch com fallback + submitResult no sucesso)
- Modify: `.env.example` (raiz) ou criar `.env.example` com `VITE_API_URL`

**Interfaces:**
- Consumes: `CHALLENGES` local (fallback), `computeXP` (já usado no sucesso).
- Produces: `fetchChallenges()`, `fetchConfig()`, `fetchRanking()`, `submitResult(payload)` — todos resilientes (retornam `null`/silêncio em falha). Base URL de `import.meta.env.VITE_API_URL`; se vazia, no-ops.

- [ ] **Step 1: Escrever o teste**

`src/services/__tests__/api.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchChallenges, submitResult } from '../api.js';

beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('api.js resiliente', () => {
  it('fetchChallenges devolve a lista em sucesso', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'c1' }] });
    expect(await fetchChallenges()).toEqual([{ id: 'c1' }]);
  });
  it('fetchChallenges devolve null em falha de rede', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchChallenges()).toBeNull();
  });
  it('fetchChallenges devolve null sem VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(await fetchChallenges()).toBeNull();
  });
  it('submitResult engole erros e não lança', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(submitResult({ grupo: 'A' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run (na RAIZ, não em backend): `npm test -- api`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/services/api.js`**

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- api`
Expected: PASS.

- [ ] **Step 5: Fiar o fetch-com-fallback no `ChallengeContext.jsx`**

No provider: adicionar um `useEffect` que, na montagem, tenta `fetchChallenges()`. Manter um estado `desafios` inicializado com `CHALLENGES` (fallback imediato). Se `fetchChallenges()` devolver uma lista não-vazia, substituir `desafios` por ela. Usar `desafios` (em vez de importar `CHALLENGES` direto) como fonte do `challenge` atual e do `goNext`. Exemplo do trecho a adicionar:

```jsx
import { fetchChallenges, submitResult } from '../services/api.js';
// ...
const [desafios, setDesafios] = useState(CHALLENGES); // fallback imediato
useEffect(() => {
  let ativo = true;
  fetchChallenges().then((remota) => {
    if (ativo && Array.isArray(remota) && remota.length > 0) setDesafios(remota);
  });
  return () => { ativo = false; };
}, []);
```
Trocar as referências internas que usavam `CHALLENGES` (para `challenge` atual e clamp do `goNext`) por `desafios`. Manter o `id`-based/`índice` como já era, agora sobre `desafios`.

- [ ] **Step 6: Disparar `submitResult` no sucesso**

No mesmo ponto onde hoje o XP é creditado (handler de sucesso — ver `creditarXP`/caminho de sucesso), adicionar um disparo fire-and-forget (após calcular `earnedXp`):

```js
const categoria = challenge.modulo != null ? String(challenge.modulo) : 'geral';
submitResult({
  grupo: grupoAtivo,
  challengeId: challenge.id,
  categoria,
  xp: earnedXp,
  dicasUsadas: hintsUsed,
  tentativas: wrongAttempts + 1,
  tempoSegundos: 0,
  acertou: true
});
```
(Não aguardar a promessa; é fire-and-forget. `tempoSegundos: 0` por enquanto — cronômetro é melhoria futura. Se `challenge` local do fallback não tiver `modulo`, cai em `'geral'`.)

- [ ] **Step 7: Rodar toda a suíte do app do aluno**

Run: `npm test`
Expected: 26 testes anteriores + testes de `api` PASSAM. `npm run build` limpo.

- [ ] **Step 8: `.env.example` da raiz**

Criar/atualizar `.env.example` na raiz com:
```
VITE_API_URL=
```
E uma linha no README explicando: vazio = 100% local; setado (ex.: `http://localhost:4000`) = busca desafios/ranking do backend com fallback.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(aluno): integração opcional com backend (fetch com fallback + envio de resultado)"
```

---

## Self-Review (cobertura do spec)

- Backend Express independente em `backend/` → Task 1 ✅
- Camadas services/repository injetável → Tasks 1-8 ✅
- Coleção `challenges` + CRUD + validação → Tasks 2, 6, 7 ✅
- Coleção `config` + público/admin → Tasks 3, 6, 7 ✅
- Coleção `groups` + ranking → Tasks 1, 4, 6 ✅
- Coleção `submissions` + recepção de resultado → Tasks 4, 6 ✅
- Dashboard/estatísticas por categoria → Tasks 5, 7 ✅
- Auth por token nos endpoints admin → Tasks 3, 7 ✅
- Endpoints do aluno públicos → Task 6 ✅
- `firebase-admin` + Firestore repo + seed → Task 8 ✅
- Env vars documentadas + deploy Render → Task 9 ✅
- Fiação do app do aluno (fetch com fallback + submit, `VITE_API_URL`, degrada offline) → Task 10 ✅
- Testes sem tocar no Firestore real (repo fake) → todas as tasks de service ✅
- Painel do Professor fora de escopo (Fase 3) → não incluído ✅
```
