# JavaBlocks — Painel do Professor Integrado (Design)

**Data:** 2026-07-10
**Escopo:** Painel do professor embutido no MESMO app do aluno (não um app React separado, como o spec original da Fase 3 previa), com sistema de login por token e rotas reais. Consome os endpoints `/api/admin/*` do backend (Fase 2), já prontos.

Depende de: app do aluno (`2026-07-05-javablocks-aluno-design.md`) e backend (`2026-07-05-javablocks-backend-design.md`).

---

## 1. Objetivo

Permitir que o professor gerencie desafios, configurações de pontuação e visualize o dashboard de estatísticas **na mesma aplicação web do aluno**, sem exigir deploy separado. O aluno continua com a experiência de hoje, sem login. O professor acessa por um link discreto, autentica com o Token Único (já existente no backend) e tem uma área administrativa com identidade visual própria.

## 2. Decisões

- **Sem login para o aluno.** A tela inicial (`/`) é exatamente a experiência atual, sem barreiras.
- **Login do professor por Token Único**, reaproveitando `POST /api/admin/verify` do backend. Sessão persiste em `sessionStorage` (sobrevive a reload, some ao fechar a aba); botão "Sair" limpa a sessão.
- **Rotas reais** via `react-router-dom` (única dependência nova): `/` (aluno), `/professor` (login), `/professor/desafios`, `/professor/dashboard`, `/professor/config` (protegidas).
- **Painel completo nesta entrega:** CRUD de desafios (criar/editar/excluir/reordenar), Dashboard (somente leitura) e Configurações (editar penalidades/bônus/XP).
- **Identidade visual distinta** para a área do professor (sidebar, layout mais denso, admin-like), separada da experiência de blocos do aluno — construída já usando a skill `frontend-design`.
- **Backend obrigatório para o painel:** se `VITE_API_URL` não estiver configurada, ou a verificação falhar por rede, a tela de login mostra uma mensagem clara em vez de falhar silenciosamente ou travar.
- **Um único professor/token global** — sem múltiplos usuários ou permissões nesta entrega, igual ao spec original.

## 3. Arquitetura e rotas

`App.jsx` passa a envolver a aplicação em `<BrowserRouter>` com as rotas:

```
/                     -> <ChallengeProvider><ChallengeScreen /></ChallengeProvider>   (inalterado)
/professor            -> <ProfessorLogin />  (ou redireciona pro dashboard se já autenticado)
/professor/desafios   -> <RequireProfessorAuth><ProfessorChallengesPage /></RequireProfessorAuth>
/professor/dashboard  -> <RequireProfessorAuth><ProfessorDashboardPage /></RequireProfessorAuth>
/professor/config     -> <RequireProfessorAuth><ProfessorConfigPage /></RequireProfessorAuth>
```

`ProfessorAuthProvider` (novo context, independente do `ChallengeContext` do aluno) envolve as rotas `/professor/*`:
- Lê o token salvo em `sessionStorage` ao montar.
- Expõe `token`, `isAuthenticated`, `login(token) -> Promise<{ok, error?}>`, `logout()`.
- `login`: chama `verifyAdminToken(token)`. 200 → salva e autentica. 401 → `{ok:false, error:'Token inválido.'}`. Sem `VITE_API_URL` ou falha de rede → `{ok:false, error:'O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.'}`.

`RequireProfessorAuth` redireciona para `/professor` se `isAuthenticated` for falso.

Ponto de entrada: link discreto "Área do Professor →" no rodapé de `ChallengeScreen.jsx` (aluno), levando a `/professor`.

## 4. Camada de dados — `src/services/adminApi.js`

Funções puras, recebem `token` como parâmetro, seguem o padrão resiliente do `api.js` existente (try/catch, nunca lançam exceção para a UI):

- `verifyAdminToken(token) -> { ok, error? }`
- `listChallengesAdmin(token) -> { ok, data? , error? }`
- `createChallenge(token, data)`, `updateChallenge(token, id, patch)`, `deleteChallenge(token, id)`, `reorderChallenges(token, order)`
- `getAdminConfig(token)`, `setAdminConfig(token, patch)`
- `getDashboard(token)`

Todas enviam o header `x-admin-token: <token>`. Base URL de `import.meta.env.VITE_API_URL` (mesmo padrão do `api.js`).

## 5. Telas do painel

**Layout (`ProfessorLayout.jsx`):** sidebar fixa à esquerda (Desafios / Dashboard / Configurações / Sair) + área de conteúdo à direita. Tema escuro com identidade visual própria (mais denso que o app do aluno — tabelas, cards, formulários), construído com a skill `frontend-design`.

**`ProfessorChallengesPage.jsx`:** lista os desafios (título, módulo, ordem) com ações Editar/Excluir e setas ↑/↓ para reordenar (chama `reorderChallenges`). Botão "Novo Desafio" abre `ChallengeFormModal.jsx` com os campos: título, descrição, objetivo pedagógico, blocos permitidos (seleção múltipla), regras (obrigatórios/proibidos/ordem/quantidade mínima), 3 dicas. Erros de validação do backend aparecem no formulário.

**`ProfessorDashboardPage.jsx`:** somente leitura. Cards de resumo (total concluídos, tempo médio, taxa de acerto, dicas usadas), tabela de ranking, desempenho por categoria.

**`ProfessorConfigPage.jsx`:** formulário com máx. de dicas, penalidade por dica, tempo entre dicas, XP base, bônus (primeira tentativa / sem dicas), penalidades (erro / bloco proibido). Salva via `setAdminConfig`.

## 6. Arquivos

```
src/
  professor/
    ProfessorAuthProvider.jsx
    ProfessorLogin.jsx
    RequireProfessorAuth.jsx
    ProfessorLayout.jsx
    ProfessorChallengesPage.jsx
    ChallengeFormModal.jsx
    ProfessorDashboardPage.jsx
    ProfessorConfigPage.jsx
  services/
    adminApi.js
  App.jsx                       (modificado: <BrowserRouter> + rotas)
  aluno/ChallengeScreen.jsx     (modificado: link "Área do Professor" no rodapé)
```

## 7. Testes

- `adminApi.js` — `fetch` mockado: sucesso, 401, erro de rede, sem `VITE_API_URL`.
- `ProfessorAuthProvider` — `renderHook`: login válido/inválido/backend indisponível, persistência em `sessionStorage`, logout.
- `RequireProfessorAuth` — redireciona quando não autenticado.
- `ChallengeFormModal` — validação de campos obrigatórios antes de enviar.

## 8. Fora de escopo

- Múltiplos professores/permissões — um único Token Único global.
- Sincronização em tempo real do dashboard (usa fetch sob demanda, sem listeners do Firestore).
- Drag-and-drop no painel do professor — reordenação via setas ↑/↓, mais simples que replicar o dnd-kit.

## 9. Plano de implementação (fases)

1. **Roteamento + auth:** `react-router-dom`, `ProfessorAuthProvider`, `adminApi.verifyAdminToken`, `ProfessorLogin`, `RequireProfessorAuth`, link no rodapé do aluno.
2. **Painel — Desafios:** `adminApi` (CRUD+reorder), `ProfessorLayout`, `ProfessorChallengesPage`, `ChallengeFormModal`.
3. **Painel — Dashboard:** `getDashboard`, `ProfessorDashboardPage`.
4. **Painel — Configurações:** `getAdminConfig`/`setAdminConfig`, `ProfessorConfigPage`.
5. **Polimento visual do painel** (frontend-design) + verificação end-to-end.
