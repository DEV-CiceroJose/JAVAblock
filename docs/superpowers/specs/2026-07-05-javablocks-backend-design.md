# JavaBlocks — Fase 2: Backend + Firebase (Design)

**Data:** 2026-07-05
**Escopo:** Backend REST (Express + Firebase Firestore) como fundação para o Painel do Professor (Fase 3), com recepção de resultados do app do aluno. Inclui a fiação mínima do app do aluno para buscar desafios (com fallback local) e enviar resultados. O Painel do Professor em si é a Fase 3.

Depende de: app do aluno já entregue (ver `2026-07-05-javablocks-aluno-design.md`).

---

## 1. Objetivo

Subir a camada de dados/API do JavaBlocks: um backend independente que serve os desafios, recebe os resultados dos alunos e expõe autoria + estatísticas protegidas por um Token Único, tudo persistido no Firestore. Isso torna o Painel do Professor (Fase 3) possível: o professor edita desafios e vê um dashboard com dados reais.

**Princípio preservado:** o app do aluno continua *offline-first*. A integração com o backend degrada com elegância — se `VITE_API_URL` não estiver setada ou a rede falhar, o app se comporta exatamente como hoje (desafios locais, sem envio de resultados).

## 2. Decisões

- **Fonte da verdade dos desafios:** Firestore. O app do aluno busca do backend ao abrir e usa os desafios locais empacotados como *fallback*. Os 2 desafios atuais são semeados no Firestore.
- **Recepção de resultados:** o app do aluno envia o resultado ao concluir um desafio (fire-and-forget, não bloqueia nem exige rede).
- **Autenticação:** endpoints do aluno (ler desafios/config/ranking, enviar resultado) são públicos. Endpoints de professor (CRUD, config, dashboard) exigem o Token Único no header `x-admin-token`. Bate com o spec original ("o professor apenas informa o Token").
- **SDK:** `firebase-admin` (servidor) — credenciais e token nunca chegam ao navegador.

## 3. Arquitetura

App independente em `backend/` (raiz do repo), deployável sozinho na Render. Node + Express. Camadas com responsabilidade única:

```
backend/
  src/
    index.js          # bootstrap do Express
    config/
      env.js          # leitura/validação das env vars
      firebase.js     # init do firebase-admin
    routes/
      public.js       # rotas do aluno
      admin.js        # rotas do professor (protegidas)
    controllers/      # adaptam req/res -> services
    services/
      challenges.js   # regras de negócio de desafios (validação de forma, ordenação)
      results.js      # registra submission + incrementa XP do grupo
      ranking.js      # agrega ranking a partir de groups
      stats.js        # agrega estatísticas do dashboard a partir de submissions
      config.js       # leitura/escrita de config
    repository/
      firestore.js    # ÚNICO ponto que fala com o Firestore (interface mockável)
    middleware/
      auth.js         # valida x-admin-token vs ADMIN_TOKEN
      cors.js         # CORS para os front-ends
      errors.js       # tratamento central de erros
  scripts/
    seed.js           # semeia challenges + config + groups no Firestore
  tests/              # Vitest; services com repository mockado
  package.json
```

**Testabilidade:** toda a lógica de negócio vive em `services/` e recebe o `repository` por injeção (parâmetro ou factory), então os testes rodam com um repository fake em memória — nunca tocam no Firestore real.

## 4. Modelo de dados (Firestore)

- **`challenges/{id}`** — `{ id, titulo, descricao, objetivoPedagogico, blocosPermitidos: string[], regras: { obrigatorios, proibidos, ordem: [a,b][], quantidadeMinima }, dicas: string[3], modulo: number, ordem: number }`. Mesma forma do `challenges.js` atual + `modulo`/`ordem` para sequenciamento.
- **`config/global`** — doc único: `{ maxDicas, penalidadePorDica, tempoEntreDicasSeg, xpBase, bonusPrimeira, bonusSemDicas, penalidadeErro, penalidadeProibido }`.
- **`groups/{nome}`** — `{ nome, xp }`. Semeado com ByteMasters, Java Warriors, NullPointer, Compiladores.
- **`submissions/{autoId}`** — `{ grupo, challengeId, categoria, xp, dicasUsadas, tentativas, tempoSegundos, acertou: boolean, timestamp }`.

Ranking ao vivo = `groups` ordenados por `xp`. Ao aceitar uma submission: grava o doc em `submissions` **e** incrementa `groups/{grupo}.xp` (transação/increment atômico). Estatísticas do dashboard são agregadas por leitura das `submissions`.

## 5. Endpoints

### Públicos (app do aluno)
- `GET /api/health` — healthcheck.
- `GET /api/challenges` — lista de desafios ordenada por `modulo`, `ordem`.
- `GET /api/challenges/:id` — um desafio.
- `GET /api/config` — subconjunto da config relevante ao aluno (`maxDicas`, `tempoEntreDicasSeg`, penalidades/bônus de XP).
- `GET /api/ranking` — grupos ordenados por XP.
- `POST /api/results` — recebe `{ grupo, challengeId, xp, dicasUsadas, tentativas, tempoSegundos, acertou }`; valida a forma; grava submission + incrementa XP. Responde 202. Erros de validação → 400; nunca derruba o app do aluno (ele ignora falhas).

### Admin (exigem `x-admin-token`)
- `POST /api/admin/verify` — valida o token (tela de login do painel). 200 se ok, 401 se não.
- `GET /api/admin/challenges` — lista completa (para edição).
- `POST /api/admin/challenges` — cria (valida forma).
- `PUT /api/admin/challenges/:id` — edita.
- `DELETE /api/admin/challenges/:id` — exclui.
- `PUT /api/admin/challenges/reorder` — recebe uma ordem e atualiza `modulo`/`ordem`.
- `GET /api/admin/config` / `PUT /api/admin/config` — lê/escreve config.
- `GET /api/admin/dashboard` — agregados das `submissions`: ranking, tempo médio, total de concluídos, dicas usadas, taxa de acerto e **desempenho por categoria** (% por categoria).

Middleware `auth` compara `x-admin-token` com `ADMIN_TOKEN`; ausência/erro → 401. CORS libera as origens em `CORS_ORIGINS`.

## 6. Mudanças no app do aluno (mínimas, degradam com elegância)

- **`src/services/api.js`** (novo): `fetchChallenges()`, `fetchConfig()`, `fetchRanking()`, `submitResult(payload)` — todos com `try/catch`, retornando `null`/silêncio em falha. Base URL de `import.meta.env.VITE_API_URL`; se vazia, todas viram no-ops que retornam `null`.
- **`ChallengeContext`**: ao montar, tenta `fetchChallenges()`; se vier lista não-vazia, usa; senão, usa os `CHALLENGES` locais (fallback). Um estado `carregando` breve enquanto tenta. Idem para config/ranking (opcional; ranking remoto só se disponível, senão mantém o local).
- **Conclusão de desafio**: no caminho de sucesso, dispara `submitResult({...})` fire-and-forget (não aguarda, engole erros).
- **Sem `VITE_API_URL`** → comportamento idêntico ao de hoje (100% local). Isso mantém a garantia de apresentação.

## 7. Variáveis de ambiente

**Backend:** `ADMIN_TOKEN`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `PORT`, `CORS_ORIGINS` (lista separada por vírgula).
**App do aluno:** `VITE_API_URL` (opcional).

## 8. Testes

Vitest no backend, com um **repository fake em memória** injetado nos services:
- `services/challenges` — validação da forma do desafio (rejeita faltando campos/ids inválidos), ordenação.
- `services/results` — validação do payload; incremento de XP; gravação da submission.
- `services/ranking` — ordenação por XP.
- `services/stats` — cálculo de tempo médio, taxa de acerto, dicas, **desempenho por categoria** a partir de um conjunto de submissions conhecido.
- `middleware/auth` — aceita token correto, rejeita ausente/errado.

App do aluno: os serviços `api.js` são finos; testar `fetchChallenges` com `fetch` mockado (sucesso → lista; falha → `null`) e garantir o fallback no context.

## 9. Deploy (Render)

- Backend como **Web Service** Node: build `npm install`, start `node src/index.js`, env vars no painel da Render.
- Firestore: criar projeto Firebase, gerar service account, preencher as três envs do Firebase.
- `scripts/seed.js` rodado uma vez para popular `challenges`/`config`/`groups`.
- README com o passo a passo (Firebase + Render + seed).

## 10. Fora de escopo (fases futuras)

- **Painel do Professor** (app React que consome os endpoints admin) — Fase 3.
- Autenticação multi-usuário, papéis, rate limiting robusto, versionamento de config.
- Sincronização em tempo real via listeners do Firestore (esta fase usa polling/refresh simples no ranking).

## 11. Plano de implementação (fases)

1. **Scaffold do backend** — Express, config/env, firebase init, healthcheck, repository interface + fake, Vitest.
2. **Desafios** — services + rotas públicas (`GET /challenges`) e admin (CRUD + reorder), validação de forma.
3. **Config + auth** — middleware de token, rotas de config, `/admin/verify`.
4. **Resultados + ranking** — `POST /results`, incremento de XP, `GET /ranking`, services testados.
5. **Dashboard/estatísticas** — agregação das submissions (taxa de acerto, tempo médio, por categoria).
6. **Seed + deploy docs** — `scripts/seed.js`, README de Firebase/Render.
7. **Fiação do app do aluno** — `services/api.js`, fetch-com-fallback no context, submit fire-and-forget, env `VITE_API_URL`.
