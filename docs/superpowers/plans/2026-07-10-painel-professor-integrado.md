# Painel do Professor Integrado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um painel do professor (CRUD de desafios, dashboard, configurações) na MESMA aplicação React do aluno, com login por Token Único e rotas reais via `react-router-dom`.

**Architecture:** `react-router-dom` divide o app em `/` (aluno, inalterado) e `/professor/*` (uma sub-árvore com seu próprio `ProfessorAuthProvider`, protegida por um guard de rota). Uma camada de dados fina (`src/services/adminApi.js`) chama os endpoints `/api/admin/*` já existentes no backend, sempre devolvendo `{ ok, data? , error? }` — nunca lança exceção para a UI.

**Tech Stack:** React 18 + Vite + Tailwind + Framer Motion (já no projeto) + `react-router-dom` (nova dependência) + Vitest/@testing-library/react (já no projeto).

## Global Constraints

- JavaScript ESM + JSX, sem TypeScript (padrão do projeto).
- Aluno continua SEM login — `/` não muda de comportamento.
- Sessão do professor em `sessionStorage`, chave `javablocks_professor_token` (não `localStorage` — deve sumir ao fechar a aba).
- Login reaproveita `POST /api/admin/verify` (header `x-admin-token`) do backend já existente.
- Sem `VITE_API_URL` configurada OU falha de rede → mensagem exata: `'O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.'`
- Token errado (401 do backend) → mensagem exata: `'Token inválido.'`
- Rotas reais: `/`, `/professor`, `/professor/desafios`, `/professor/dashboard`, `/professor/config`.
- Um único Token Único global — sem múltiplos usuários/permissões.
- Todas as funções de `src/services/adminApi.js` recebem `token` como parâmetro (nunca leem de um context internamente) — mesmo padrão de `src/services/api.js`.
- Identidade visual distinta para a área do professor: sidebar + paleta com o token `adminAccent` (novo, adicionado ao `tailwind.config.js`), mantendo o tema escuro (`base-bg`/`base-panel`/`base-border`) do resto do app.
- Testes: `npm test` na raiz (Vitest); arquivos que renderizam componentes precisam de `// @vitest-environment jsdom` no topo.

## Contrato do backend (referência — não implementar, já existe)

Base: `import.meta.env.VITE_API_URL` (ex.: `http://localhost:4000`). Header `x-admin-token: <token>` em toda rota abaixo.

- `POST /api/admin/verify` → 200 `{ok:true}` | 401 `{error:'Token inválido ou ausente.'}`
- `GET /api/admin/challenges` → 200 `Challenge[]`
- `POST /api/admin/challenges` (body = `Challenge` sem envelope) → 201 `Challenge` | 400 `{errors:string[]}`
- `PUT /api/admin/challenges/:id` (body = patch) → 200 `Challenge` | 404 `{error:'Desafio não encontrado.'}` | 400 `{errors:string[]}`
- `DELETE /api/admin/challenges/:id` → 200 `{ok:true}` | 404 `{error:'Desafio não encontrado.'}`
- `PUT /api/admin/challenges/reorder` (body = `{order:[{id,modulo,ordem}]}`) → 200 `{ok:true}`
- `GET /api/admin/config` → 200 `{maxDicas,penalidadePorDica,tempoEntreDicasSeg,xpBase,bonusPrimeira,bonusSemDicas,penalidadeErro,penalidadeProibido}`
- `PUT /api/admin/config` (body = patch, mesmos campos) → 200 config atualizada
- `GET /api/admin/dashboard` → 200 `{ranking:[{nome,xp}], totalConcluidos, tempoMedioSeg, dicasUsadas, taxaAcerto, porCategoria:{[categoria]:percentual}}`

`Challenge` = `{ id, titulo, descricao, objetivoPedagogico, modulo, ordem, blocosPermitidos:string[], regras:{obrigatorios:string[], proibidos:string[], ordem:[string,string][], quantidadeMinima:number}, dicas:string[3] }`.

---

## Task 1: Roteamento base + `adminApi.verifyAdminToken` + `ProfessorAuthProvider`

**Files:**
- Modify: `package.json` (adiciona `react-router-dom`)
- Create: `src/services/adminApi.js`
- Create: `src/professor/ProfessorAuthProvider.jsx`
- Test: `src/services/__tests__/adminApi.test.js`
- Test: `src/professor/__tests__/ProfessorAuthProvider.test.jsx`

**Interfaces:**
- Produces: `adminRequest(path, token, options?) -> Promise<{ok:true,data}|{ok:false,error}>` (helper interno, não exportado); `verifyAdminToken(token) -> Promise<{ok, error?}>`; `ProfessorAuthProvider`, `useProfessorAuth() -> {token, isAuthenticated, login(token)->Promise<{ok,error?}>, logout()}`.

- [ ] **Step 1: Adicionar a dependência**

Em `package.json`, dentro de `"dependencies"`, adicionar:
```json
"react-router-dom": "^6.26.2",
```
Run: `npm install`

- [ ] **Step 2: Escrever o teste de `verifyAdminToken`**

`src/services/__tests__/adminApi.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdminToken } from '../adminApi.js';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('verifyAdminToken', () => {
  it('sem VITE_API_URL retorna erro de backend não configurado', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const r = await verifyAdminToken('qualquer');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.');
  });

  it('token correto retorna ok', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await verifyAdminToken('correto');
    expect(r.ok).toBe(true);
  });

  it('token errado (401) retorna "Token inválido."', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token inválido ou ausente.' })
    });
    const r = await verifyAdminToken('errado');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Token inválido.');
  });

  it('falha de rede retorna erro de backend não configurado', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    const r = await verifyAdminToken('qualquer');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente.');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- adminApi`
Expected: FAIL (módulo `../adminApi.js` não existe).

- [ ] **Step 4: Implementar `src/services/adminApi.js`**

```js
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
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- adminApi`
Expected: PASS (4 testes).

- [ ] **Step 6: Escrever o teste de `ProfessorAuthProvider`**

`src/professor/__tests__/ProfessorAuthProvider.test.jsx`:
```jsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProfessorAuthProvider, useProfessorAuth } from '../ProfessorAuthProvider.jsx';

vi.mock('../../services/adminApi.js', () => ({
  verifyAdminToken: vi.fn()
}));
import { verifyAdminToken } from '../../services/adminApi.js';

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('ProfessorAuthProvider', () => {
  it('começa não autenticado sem token salvo', () => {
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login com token válido autentica e persiste em sessionStorage', async () => {
    verifyAdminToken.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    let response;
    await act(async () => {
      response = await result.current.login('meu-token');
    });
    expect(response.ok).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(sessionStorage.getItem('javablocks_professor_token')).toBe('meu-token');
  });

  it('login com token inválido não autentica e devolve o erro', async () => {
    verifyAdminToken.mockResolvedValue({ ok: false, error: 'Token inválido.' });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    let response;
    await act(async () => {
      response = await result.current.login('errado');
    });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('Token inválido.');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restaura sessão de um token salvo em sessionStorage', () => {
    sessionStorage.setItem('javablocks_professor_token', 'ja-salvo');
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('ja-salvo');
  });

  it('logout limpa o token e a sessão', async () => {
    verifyAdminToken.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    await act(async () => {
      await result.current.login('meu-token');
    });
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem('javablocks_professor_token')).toBeNull();
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npm test -- ProfessorAuthProvider`
Expected: FAIL (módulo `../ProfessorAuthProvider.jsx` não existe).

- [ ] **Step 8: Implementar `src/professor/ProfessorAuthProvider.jsx`**

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { verifyAdminToken } from '../services/adminApi.js';

const STORAGE_KEY = 'javablocks_professor_token';
const ProfessorAuthContext = createContext(null);

export function ProfessorAuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');

  const login = useCallback(async (candidateToken) => {
    const result = await verifyAdminToken(candidateToken);
    if (result.ok) {
      sessionStorage.setItem(STORAGE_KEY, candidateToken);
      setToken(candidateToken);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken('');
  }, []);

  const value = { token, isAuthenticated: Boolean(token), login, logout };
  return <ProfessorAuthContext.Provider value={value}>{children}</ProfessorAuthContext.Provider>;
}

export function useProfessorAuth() {
  const ctx = useContext(ProfessorAuthContext);
  if (!ctx) throw new Error('useProfessorAuth must be used within a ProfessorAuthProvider');
  return ctx;
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npm test -- ProfessorAuthProvider`
Expected: PASS (5 testes).

- [ ] **Step 10: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS (todos os testes anteriores + os 9 novos).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(professor): adminApi.verifyAdminToken + ProfessorAuthProvider"
```

---

## Task 2: Login, guarda de rota e wiring das rotas base

**Files:**
- Modify: `tailwind.config.js` (token `adminAccent`)
- Create: `src/professor/RequireProfessorAuth.jsx`
- Create: `src/professor/ProfessorLogin.jsx`
- Create: `src/professor/ProfessorApp.jsx`
- Modify: `src/App.jsx`
- Modify: `src/aluno/ChallengeScreen.jsx` (link "Área do Professor →")
- Test: `src/professor/__tests__/RequireProfessorAuth.test.jsx`

**Interfaces:**
- Consumes: `ProfessorAuthProvider`, `useProfessorAuth` (Task 1).
- Produces: `<RequireProfessorAuth>{children}</RequireProfessorAuth>` (redireciona para `/professor` se não autenticado); `<ProfessorLogin />`; `<ProfessorApp />` (monta `ProfessorAuthProvider` + `<Routes>` da sub-árvore `/professor/*` — ÚNICO ponto que as Tasks 4/5/6 vão modificar para adicionar novas rotas).

- [ ] **Step 1: Adicionar o token `adminAccent` ao Tailwind**

Em `tailwind.config.js`, dentro de `colors`:
```js
colors: {
  base: { bg: '#0f1117', panel: '#171a23', border: '#262a36' },
  accent: { DEFAULT: '#4f8cff', hover: '#3a76e8' },
  adminAccent: { DEFAULT: '#8b5cf6', hover: '#7c3aed' }
}
```

- [ ] **Step 2: Escrever o teste de `RequireProfessorAuth`**

`src/professor/__tests__/RequireProfessorAuth.test.jsx`:
```jsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireProfessorAuth from '../RequireProfessorAuth.jsx';
import { ProfessorAuthProvider } from '../ProfessorAuthProvider.jsx';

beforeEach(() => {
  sessionStorage.clear();
});

function renderProtected(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProfessorAuthProvider>
        <Routes>
          <Route path="/professor" element={<div>Tela de login</div>} />
          <Route
            path="/professor/desafios"
            element={
              <RequireProfessorAuth>
                <div>Conteúdo protegido</div>
              </RequireProfessorAuth>
            }
          />
        </Routes>
      </ProfessorAuthProvider>
    </MemoryRouter>
  );
}

describe('RequireProfessorAuth', () => {
  it('redireciona para /professor quando não autenticado', () => {
    renderProtected('/professor/desafios');
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('mostra o conteúdo protegido quando já autenticado (token salvo)', () => {
    sessionStorage.setItem('javablocks_professor_token', 'valido');
    renderProtected('/professor/desafios');
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- RequireProfessorAuth`
Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar `src/professor/RequireProfessorAuth.jsx`**

```jsx
import { Navigate } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';

export default function RequireProfessorAuth({ children }) {
  const { isAuthenticated } = useProfessorAuth();
  if (!isAuthenticated) {
    return <Navigate to="/professor" replace />;
  }
  return children;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- RequireProfessorAuth`
Expected: PASS (2 testes).

- [ ] **Step 6: Implementar `src/professor/ProfessorLogin.jsx`**

```jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import Button from '../components/ui/Button.jsx';

export default function ProfessorLogin() {
  const { login, isAuthenticated } = useProfessorAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/professor/desafios" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(tokenInput);
    setLoading(false);
    if (result.ok) {
      navigate('/professor/desafios', { replace: true });
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-base-panel border border-base-border rounded-2xl p-6 shadow-xl"
      >
        <h1 className="text-xl font-bold mb-1">Área do Professor</h1>
        <p className="text-sm text-slate-400 mb-4">
          Informe o token de acesso para gerenciar desafios, configurações e ver o dashboard.
        </p>
        <label className="flex flex-col gap-1 text-sm text-slate-300 mb-4">
          Token
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            autoFocus
            className="bg-base-bg border border-base-border rounded-lg px-3 py-2 text-slate-100
              focus:outline-none focus:ring-1 focus:ring-adminAccent"
          />
        </label>
        {error && <div className="text-sm text-red-400 mb-4 break-words">{error}</div>}
        <Button type="submit" disabled={loading || !tokenInput} className="w-full">
          {loading ? 'Verificando...' : 'Entrar'}
        </Button>
        <Link
          to="/"
          className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-4 transition"
        >
          ← Voltar para o app do aluno
        </Link>
      </form>
    </div>
  );
}
```

- [ ] **Step 7: Implementar `src/professor/ProfessorApp.jsx`**

```jsx
import { Routes, Route } from 'react-router-dom';
import { ProfessorAuthProvider } from './ProfessorAuthProvider.jsx';
import ProfessorLogin from './ProfessorLogin.jsx';

export default function ProfessorApp() {
  return (
    <ProfessorAuthProvider>
      <Routes>
        <Route path="/" element={<ProfessorLogin />} />
      </Routes>
    </ProfessorAuthProvider>
  );
}
```

- [ ] **Step 8: Modificar `src/App.jsx`**

Substituir o conteúdo inteiro por:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChallengeProvider } from './context/ChallengeContext.jsx';
import ChallengeScreen from './aluno/ChallengeScreen.jsx';
import ProfessorApp from './professor/ProfessorApp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ChallengeProvider>
              <ChallengeScreen />
            </ChallengeProvider>
          }
        />
        <Route path="/professor/*" element={<ProfessorApp />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 9: Adicionar o link no rodapé do aluno**

Em `src/aluno/ChallengeScreen.jsx`, adicionar ao bloco de imports do topo (junto aos demais imports de `react-router-dom` não existem ainda — este é o primeiro):
```jsx
import { Link } from 'react-router-dom';
```

E, logo antes do `</div>` final do componente (depois de `<Toast />`), adicionar:
```jsx
      <SuccessOverlay open={overlayOpen} xp={earnedXp} onNext={handleNext} isLast={isLast} />
      <Toast />
      <div className="text-center mt-4">
        <Link to="/professor" className="text-xs text-slate-600 hover:text-slate-400 transition">
          Área do Professor →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Rodar a suíte inteira e o build**

Run: `npm test`
Expected: PASS (todos os testes anteriores + os 2 novos de `RequireProfessorAuth`).

Run: `npm run build`
Expected: build limpo, sem erros.

- [ ] **Step 11: Verificação no navegador**

Usando as ferramentas de preview:
1. Abrir `/` — confirmar que o link "Área do Professor →" aparece no rodapé e leva para `/professor`.
2. Em `/professor`, preencher qualquer token e submeter SEM `VITE_API_URL` configurada — confirmar que aparece a mensagem: "O painel do professor exige o backend rodando. Configure VITE_API_URL e tente novamente."
3. Confirmar que o link "← Voltar para o app do aluno" volta para `/`.
4. Sem erros no console.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(professor): login, guarda de rota e wiring das rotas /professor"
```

---

## Task 3: `adminApi` — CRUD e reorder de desafios

**Files:**
- Modify: `src/services/adminApi.js` (adiciona funções)
- Modify: `src/services/__tests__/adminApi.test.js` (adiciona testes)

**Interfaces:**
- Consumes: `adminRequest` (helper interno de Task 1).
- Produces: `listChallengesAdmin(token)`, `createChallenge(token, data)`, `updateChallenge(token, id, patch)`, `deleteChallenge(token, id)`, `reorderChallenges(token, order)` — todas `-> Promise<{ok:true,data}|{ok:false,error}>`.

- [ ] **Step 1: Adicionar os testes**

No final de `src/services/__tests__/adminApi.test.js`, adicionar:
```js
import { listChallengesAdmin, createChallenge, updateChallenge, deleteChallenge, reorderChallenges } from '../adminApi.js';

describe('listChallengesAdmin', () => {
  it('retorna a lista em sucesso', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [{ id: 'c1' }] });
    const r = await listChallengesAdmin('tok');
    expect(r.ok).toBe(true);
    expect(r.data).toEqual([{ id: 'c1' }]);
  });
});

describe('createChallenge', () => {
  it('em sucesso devolve o desafio criado', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 'c1' }) });
    const r = await createChallenge('tok', { id: 'c1' });
    expect(r.ok).toBe(true);
    expect(r.data.id).toBe('c1');
  });

  it('em erro de validação (400) junta as mensagens de erro', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errors: ['id é obrigatório', 'dicas deve ter exatamente 3 itens'] })
    });
    const r = await createChallenge('tok', {});
    expect(r.ok).toBe(false);
    expect(r.error).toBe('id é obrigatório dicas deve ter exatamente 3 itens');
  });
});

describe('updateChallenge', () => {
  it('404 devolve a mensagem do backend', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Desafio não encontrado.' })
    });
    const r = await updateChallenge('tok', 'nope', { titulo: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Desafio não encontrado.');
  });
});

describe('deleteChallenge', () => {
  it('em sucesso devolve ok:true', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await deleteChallenge('tok', 'c1');
    expect(r.ok).toBe(true);
  });
});

describe('reorderChallenges', () => {
  it('envia a nova ordem e devolve ok:true', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await reorderChallenges('tok', [{ id: 'c1', modulo: 1, ordem: 1 }]);
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- adminApi`
Expected: FAIL (as 5 novas funções não existem).

- [ ] **Step 3: Adicionar as funções em `src/services/adminApi.js`**

Ao final do arquivo (depois de `verifyAdminToken`):
```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- adminApi`
Expected: PASS (9 testes: os 4 de `verifyAdminToken` + os 5 novos).

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(professor): adminApi — CRUD e reorder de desafios"
```

---

## Task 4: Painel — Desafios (layout, lista, formulário)

**Files:**
- Create: `src/professor/ProfessorLayout.jsx`
- Create: `src/professor/ProfessorChallengesPage.jsx`
- Create: `src/professor/ChallengeFormModal.jsx`
- Modify: `src/professor/ProfessorApp.jsx` (adiciona rota `/desafios`)
- Test: `src/professor/__tests__/ChallengeFormModal.test.jsx`

**Interfaces:**
- Consumes: `useProfessorAuth` (Task 1); `listChallengesAdmin`, `createChallenge`, `updateChallenge`, `deleteChallenge`, `reorderChallenges` (Task 3); `BLOCKS` de `src/data/blocks.js`; `Button` de `src/components/ui/Button.jsx`.
- Produces: `<ProfessorLayout>{children}</ProfessorLayout>` (sidebar com nav Desafios/Dashboard/Configurações/Sair); `<ChallengeFormModal open challenge={null|Challenge} onClose onSaved />`.

- [ ] **Step 1: Implementar `src/professor/ProfessorLayout.jsx`**

```jsx
import { NavLink } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';

const NAV_ITEMS = [
  { to: '/professor/desafios', label: 'Desafios' },
  { to: '/professor/dashboard', label: 'Dashboard' },
  { to: '/professor/config', label: 'Configurações' }
];

export default function ProfessorLayout({ children }) {
  const { logout } = useProfessorAuth();

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 flex flex-col sm:flex-row">
      <aside className="sm:w-56 sm:shrink-0 sm:min-h-screen bg-base-panel border-b sm:border-b-0 sm:border-r border-base-border flex flex-col">
        <div className="px-5 py-5 border-b border-base-border">
          <span className="text-xs uppercase tracking-wide text-slate-500">JavaBlocks</span>
          <h1 className="text-lg font-bold text-adminAccent">Painel do Professor</h1>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-adminAccent/15 text-adminAccent'
                    : 'text-slate-300 hover:bg-base-bg hover:text-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-base-border">
          <button
            type="button"
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-base-bg transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Escrever o teste de validação do formulário**

`src/professor/__tests__/ChallengeFormModal.test.jsx`:
```jsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChallengeFormModal from '../ChallengeFormModal.jsx';
import { ProfessorAuthProvider } from '../ProfessorAuthProvider.jsx';

vi.mock('../../services/adminApi.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createChallenge: vi.fn(), updateChallenge: vi.fn() };
});
import { createChallenge } from '../../services/adminApi.js';

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

function renderModal(props = {}) {
  return render(
    <ProfessorAuthProvider>
      <ChallengeFormModal open challenge={null} onClose={() => {}} onSaved={() => {}} {...props} />
    </ProfessorAuthProvider>
  );
}

describe('ChallengeFormModal', () => {
  it('não envia e mostra erros quando campos obrigatórios estão vazios', () => {
    renderModal();
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(/id é obrigatório/i)).toBeInTheDocument();
    expect(createChallenge).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- ChallengeFormModal`
Expected: FAIL (módulo `../ChallengeFormModal.jsx` não existe).

- [ ] **Step 4: Implementar `src/professor/ChallengeFormModal.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { createChallenge, updateChallenge } from '../services/adminApi.js';
import { BLOCKS } from '../data/blocks.js';
import Button from '../components/ui/Button.jsx';

const CAMPOS_VAZIOS = {
  id: '',
  titulo: '',
  descricao: '',
  objetivoPedagogico: '',
  modulo: 1,
  ordem: 1,
  blocosPermitidos: [],
  obrigatorios: [],
  proibidos: [],
  ordemPares: [],
  quantidadeMinima: 1,
  dica1: '',
  dica2: '',
  dica3: ''
};

function challengeToForm(challenge) {
  if (!challenge) return { ...CAMPOS_VAZIOS };
  return {
    id: challenge.id || '',
    titulo: challenge.titulo || '',
    descricao: challenge.descricao || '',
    objetivoPedagogico: challenge.objetivoPedagogico || '',
    modulo: challenge.modulo ?? 1,
    ordem: challenge.ordem ?? 1,
    blocosPermitidos: challenge.blocosPermitidos || [],
    obrigatorios: challenge.regras?.obrigatorios || [],
    proibidos: challenge.regras?.proibidos || [],
    ordemPares: challenge.regras?.ordem || [],
    quantidadeMinima: challenge.regras?.quantidadeMinima ?? 1,
    dica1: challenge.dicas?.[0] || '',
    dica2: challenge.dicas?.[1] || '',
    dica3: challenge.dicas?.[2] || ''
  };
}

function formToChallenge(form) {
  return {
    id: form.id.trim(),
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    objetivoPedagogico: form.objetivoPedagogico.trim(),
    modulo: Number(form.modulo),
    ordem: Number(form.ordem),
    blocosPermitidos: form.blocosPermitidos,
    regras: {
      obrigatorios: form.obrigatorios,
      proibidos: form.proibidos,
      ordem: form.ordemPares,
      quantidadeMinima: Number(form.quantidadeMinima)
    },
    dicas: [form.dica1.trim(), form.dica2.trim(), form.dica3.trim()]
  };
}

function validateForm(form) {
  const errors = [];
  if (!form.id.trim()) errors.push('id é obrigatório.');
  if (!form.titulo.trim()) errors.push('título é obrigatório.');
  if (!form.descricao.trim()) errors.push('descrição é obrigatória.');
  if (!form.objetivoPedagogico.trim()) errors.push('objetivo pedagógico é obrigatório.');
  if (form.blocosPermitidos.length === 0) errors.push('selecione ao menos um bloco permitido.');
  if (!form.dica1.trim() || !form.dica2.trim() || !form.dica3.trim()) {
    errors.push('as 3 dicas são obrigatórias.');
  }
  return errors;
}

function toggleInArray(array, value) {
  return array.includes(value) ? array.filter((v) => v !== value) : [...array, value];
}

export default function ChallengeFormModal({ open, challenge, onClose, onSaved }) {
  const { token } = useProfessorAuth();
  const [form, setForm] = useState(() => challengeToForm(challenge));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(challenge);

  useEffect(() => {
    if (open) {
      setForm(challengeToForm(challenge));
      setErrors([]);
    }
  }, [open, challenge]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addOrdemPar() {
    if (form.blocosPermitidos.length < 2) return;
    setForm((prev) => ({
      ...prev,
      ordemPares: [...prev.ordemPares, [prev.blocosPermitidos[0], prev.blocosPermitidos[1]]]
    }));
  }

  function updateOrdemPar(index, position, value) {
    setForm((prev) => ({
      ...prev,
      ordemPares: prev.ordemPares.map((par, i) =>
        i === index ? (position === 0 ? [value, par[1]] : [par[0], value]) : par
      )
    }));
  }

  function removeOrdemPar(index) {
    setForm((prev) => ({ ...prev, ordemPares: prev.ordemPares.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const localErrors = validateForm(form);
    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }
    setSaving(true);
    setErrors([]);
    const payload = formToChallenge(form);
    const result = isEditing
      ? await updateChallenge(token, challenge.id, payload)
      : await createChallenge(token, payload);
    setSaving(false);
    if (result.ok) {
      onSaved();
    } else {
      setErrors([result.error]);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-base-panel border border-base-border
            rounded-2xl p-6 my-8"
        >
          <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Desafio' : 'Novo Desafio'}</h2>

          {errors.length > 0 && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
              {errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              id (único, sem espaços)
              <input
                value={form.id}
                onChange={(e) => updateField('id', e.target.value)}
                disabled={isEditing}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100 disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              título
              <input
                value={form.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
            descrição
            <textarea
              value={form.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              rows={3}
              className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
            objetivo pedagógico
            <input
              value={form.objetivoPedagogico}
              onChange={(e) => updateField('objetivoPedagogico', e.target.value)}
              className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
            />
          </label>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              módulo
              <input
                type="number"
                value={form.modulo}
                onChange={(e) => updateField('modulo', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              ordem
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => updateField('ordem', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              quantidade mínima de blocos
              <input
                type="number"
                value={form.quantidadeMinima}
                onChange={(e) => updateField('quantidadeMinima', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          </div>

          <fieldset className="mb-4">
            <legend className="text-xs text-slate-400 mb-2">blocos permitidos</legend>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-base-border rounded-lg p-2">
              {BLOCKS.map((block) => (
                <label
                  key={block.id}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-base-border cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.blocosPermitidos.includes(block.id)}
                    onChange={() => updateField('blocosPermitidos', toggleInArray(form.blocosPermitidos, block.id))}
                  />
                  {block.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <fieldset>
              <legend className="text-xs text-slate-400 mb-2">obrigatórios</legend>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-base-border rounded-lg p-2">
                {form.blocosPermitidos.map((id) => (
                  <label key={id} className="flex items-center gap-1.5 text-xs px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.obrigatorios.includes(id)}
                      onChange={() => updateField('obrigatorios', toggleInArray(form.obrigatorios, id))}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs text-slate-400 mb-2">proibidos</legend>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-base-border rounded-lg p-2">
                {form.blocosPermitidos.map((id) => (
                  <label key={id} className="flex items-center gap-1.5 text-xs px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.proibidos.includes(id)}
                      onChange={() => updateField('proibidos', toggleInArray(form.proibidos, id))}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="mb-4">
            <legend className="text-xs text-slate-400 mb-2">ordem entre blocos (A antes de B)</legend>
            <div className="flex flex-col gap-2">
              {form.ordemPares.map((par, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={par[0]}
                    onChange={(e) => updateOrdemPar(index, 0, e.target.value)}
                    className="bg-base-bg border border-base-border rounded px-2 py-1 text-xs text-slate-100"
                  >
                    {form.blocosPermitidos.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">antes de</span>
                  <select
                    value={par[1]}
                    onChange={(e) => updateOrdemPar(index, 1, e.target.value)}
                    className="bg-base-bg border border-base-border rounded px-2 py-1 text-xs text-slate-100"
                  >
                    {form.blocosPermitidos.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeOrdemPar(index)} className="text-red-400 text-sm hover:underline">
                    remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOrdemPar}
                disabled={form.blocosPermitidos.length < 2}
                className="text-xs text-adminAccent hover:underline text-left disabled:opacity-40"
              >
                + adicionar par de ordem
              </button>
            </div>
          </fieldset>

          <fieldset className="mb-6">
            <legend className="text-xs text-slate-400 mb-2">dicas progressivas (3, obrigatórias)</legend>
            <div className="flex flex-col gap-2">
              <input
                value={form.dica1}
                onChange={(e) => updateField('dica1', e.target.value)}
                placeholder="Dica 1 — conceito"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                value={form.dica2}
                onChange={(e) => updateField('dica2', e.target.value)}
                placeholder="Dica 2 — quais blocos"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                value={form.dica3}
                onChange={(e) => updateField('dica3', e.target.value)}
                placeholder="Dica 3 — ordem parcial"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 transition"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- ChallengeFormModal`
Expected: PASS (1 teste).

- [ ] **Step 6: Implementar `src/professor/ProfessorChallengesPage.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { listChallengesAdmin, deleteChallenge, reorderChallenges } from '../services/adminApi.js';
import ChallengeFormModal from './ChallengeFormModal.jsx';
import Button from '../components/ui/Button.jsx';

function sortChallenges(list) {
  return [...list].sort((a, b) => a.modulo - b.modulo || a.ordem - b.ordem);
}

export default function ProfessorChallengesPage() {
  const { token } = useProfessorAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listChallengesAdmin(token);
    setLoading(false);
    if (result.ok) {
      setChallenges(result.data || []);
      setError('');
    } else {
      setError(result.error);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(challenge) {
    setEditing(challenge);
    setModalOpen(true);
  }

  async function handleDelete(challenge) {
    if (!window.confirm(`Excluir o desafio "${challenge.titulo}"? Essa ação não pode ser desfeita.`)) return;
    const result = await deleteChallenge(token, challenge.id);
    if (result.ok) load();
    else setError(result.error);
  }

  async function handleMove(challenge, direction) {
    const sorted = sortChallenges(challenges);
    const index = sorted.findIndex((c) => c.id === challenge.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapWith];
    const order = sorted.map((c) => {
      if (c.id === a.id) return { id: a.id, modulo: b.modulo, ordem: b.ordem };
      if (c.id === b.id) return { id: b.id, modulo: a.modulo, ordem: a.ordem };
      return { id: c.id, modulo: c.modulo, ordem: c.ordem };
    });
    const result = await reorderChallenges(token, order);
    if (result.ok) load();
    else setError(result.error);
  }

  function handleSaved() {
    setModalOpen(false);
    load();
  }

  const sorted = sortChallenges(challenges);

  return (
    <ProfessorLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Desafios</h2>
        <Button onClick={openCreate}>Novo Desafio</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : sorted.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhum desafio cadastrado ainda.</p>
      ) : (
        <div className="bg-base-panel border border-base-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Módulo</th>
                <th className="px-4 py-3 font-medium">Ordem</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((challenge, index) => (
                <tr key={challenge.id} className="border-b border-base-border last:border-0">
                  <td className="px-4 py-3 text-slate-100">{challenge.titulo}</td>
                  <td className="px-4 py-3 text-slate-400">{challenge.modulo}</td>
                  <td className="px-4 py-3 text-slate-400">{challenge.ordem}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(challenge, 'up')}
                        disabled={index === 0}
                        aria-label="Mover para cima"
                        className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(challenge, 'down')}
                        disabled={index === sorted.length - 1}
                        aria-label="Mover para baixo"
                        className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => openEdit(challenge)} className="px-2 py-1 text-adminAccent hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => handleDelete(challenge)} className="px-2 py-1 text-red-400 hover:underline">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChallengeFormModal open={modalOpen} challenge={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
    </ProfessorLayout>
  );
}
```

- [ ] **Step 7: Adicionar a rota em `src/professor/ProfessorApp.jsx`**

Substituir o conteúdo por:
```jsx
import { Routes, Route } from 'react-router-dom';
import { ProfessorAuthProvider } from './ProfessorAuthProvider.jsx';
import ProfessorLogin from './ProfessorLogin.jsx';
import RequireProfessorAuth from './RequireProfessorAuth.jsx';
import ProfessorChallengesPage from './ProfessorChallengesPage.jsx';

export default function ProfessorApp() {
  return (
    <ProfessorAuthProvider>
      <Routes>
        <Route path="/" element={<ProfessorLogin />} />
        <Route
          path="desafios"
          element={
            <RequireProfessorAuth>
              <ProfessorChallengesPage />
            </RequireProfessorAuth>
          }
        />
      </Routes>
    </ProfessorAuthProvider>
  );
}
```

- [ ] **Step 8: Rodar a suíte inteira e o build**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 9: Verificação no navegador**

Usando as ferramentas de preview: definir `sessionStorage.setItem('javablocks_professor_token', 'qualquer')` via `preview_eval` (simula sessão autenticada sem precisar do backend real) e navegar para `/professor/desafios`. Confirmar:
1. A sidebar aparece com Desafios/Dashboard/Configurações/Sair.
2. Como não há backend real rodando, a lista mostra a mensagem de erro do `adminApi` (comportamento esperado e correto — não deve travar nem quebrar o React).
3. Clicar em "Novo Desafio" abre o modal.
4. Clicar em "Salvar" com o formulário vazio mostra os erros de validação (sem chamar a API).
5. Sem erros no console.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(professor): painel de desafios (layout, lista, CRUD, reorder)"
```

---

## Task 5: Painel — Dashboard

**Files:**
- Modify: `src/services/adminApi.js` (adiciona `getDashboard`)
- Modify: `src/services/__tests__/adminApi.test.js` (adiciona teste)
- Create: `src/professor/ProfessorDashboardPage.jsx`
- Modify: `src/professor/ProfessorApp.jsx` (adiciona rota `/dashboard`)

**Interfaces:**
- Consumes: `adminRequest` (Task 1); `ProfessorLayout` (Task 4); `useProfessorAuth` (Task 1).
- Produces: `getDashboard(token) -> Promise<{ok:true,data}|{ok:false,error}>`.

- [ ] **Step 1: Adicionar o teste**

No final de `src/services/__tests__/adminApi.test.js`:
```js
import { getDashboard } from '../adminApi.js';

describe('getDashboard', () => {
  it('em sucesso devolve os dados agregados', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    const dados = {
      ranking: [{ nome: 'A', xp: 10 }],
      totalConcluidos: 5,
      tempoMedioSeg: 90,
      dicasUsadas: 2,
      taxaAcerto: 0.8,
      porCategoria: { geral: 80 }
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => dados });
    const r = await getDashboard('tok');
    expect(r.ok).toBe(true);
    expect(r.data).toEqual(dados);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- adminApi`
Expected: FAIL (`getDashboard` não existe).

- [ ] **Step 3: Adicionar a função em `src/services/adminApi.js`**

```js
export async function getDashboard(token) {
  return adminRequest('/api/admin/dashboard', token);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- adminApi`
Expected: PASS (10 testes).

- [ ] **Step 5: Implementar `src/professor/ProfessorDashboardPage.jsx`**

```jsx
import { useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { getDashboard } from '../services/adminApi.js';

function StatCard({ label, value }) {
  return (
    <div className="bg-base-panel border border-base-border rounded-xl p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

export default function ProfessorDashboardPage() {
  const { token } = useProfessorAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    getDashboard(token).then((result) => {
      if (!ativo) return;
      setLoading(false);
      if (result.ok) setData(result.data);
      else setError(result.error);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <ProfessorLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Desafios concluídos" value={data.totalConcluidos} />
            <StatCard label="Tempo médio" value={`${data.tempoMedioSeg}s`} />
            <StatCard label="Taxa de acerto" value={`${Math.round(data.taxaAcerto * 100)}%`} />
            <StatCard label="Dicas usadas" value={data.dicasUsadas} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-base-panel border border-base-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Ranking</h3>
              <ol className="flex flex-col gap-2">
                {data.ranking.map((grupo, i) => (
                  <li key={grupo.nome} className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">
                      {i + 1}. {grupo.nome}
                    </span>
                    <span className="text-adminAccent font-semibold">{grupo.xp} XP</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-base-panel border border-base-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Desempenho por categoria</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(data.porCategoria).map(([categoria, percentual]) => (
                  <div key={categoria}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{categoria}</span>
                      <span>{percentual}%</span>
                    </div>
                    <div className="h-2 bg-base-bg rounded-full overflow-hidden">
                      <div className="h-full bg-adminAccent rounded-full" style={{ width: `${percentual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ProfessorLayout>
  );
}
```

- [ ] **Step 6: Adicionar a rota em `src/professor/ProfessorApp.jsx`**

Adicionar o import `import ProfessorDashboardPage from './ProfessorDashboardPage.jsx';` e, dentro de `<Routes>`, depois da rota `desafios`:
```jsx
        <Route
          path="dashboard"
          element={
            <RequireProfessorAuth>
              <ProfessorDashboardPage />
            </RequireProfessorAuth>
          }
        />
```

- [ ] **Step 7: Rodar a suíte inteira e o build**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 8: Verificação no navegador**

Com `sessionStorage` simulando sessão autenticada (Step 9 da Task 4), navegar para `/professor/dashboard`. Confirmar que a mensagem de erro (backend indisponível) aparece corretamente, sem quebrar a tela, e que a sidebar continua funcional.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(professor): painel de dashboard (ranking, estatísticas, desempenho por categoria)"
```

---

## Task 6: Painel — Configurações

**Files:**
- Modify: `src/services/adminApi.js` (adiciona `getAdminConfig`, `setAdminConfig`)
- Modify: `src/services/__tests__/adminApi.test.js` (adiciona testes)
- Create: `src/professor/ProfessorConfigPage.jsx`
- Modify: `src/professor/ProfessorApp.jsx` (adiciona rota `/config`)

**Interfaces:**
- Consumes: `adminRequest` (Task 1); `ProfessorLayout` (Task 4); `useProfessorAuth` (Task 1); `Button` de `src/components/ui/Button.jsx`.
- Produces: `getAdminConfig(token)`, `setAdminConfig(token, patch)` `-> Promise<{ok:true,data}|{ok:false,error}>`.

- [ ] **Step 1: Adicionar os testes**

No final de `src/services/__tests__/adminApi.test.js`:
```js
import { getAdminConfig, setAdminConfig } from '../adminApi.js';

describe('getAdminConfig', () => {
  it('em sucesso devolve a config completa', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    const config = {
      maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15,
      xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20,
      penalidadeErro: 10, penalidadeProibido: 20
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => config });
    const r = await getAdminConfig('tok');
    expect(r.ok).toBe(true);
    expect(r.data).toEqual(config);
  });
});

describe('setAdminConfig', () => {
  it('envia o patch e devolve a config atualizada', async () => {
    vi.stubEnv('VITE_API_URL', 'http://x');
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ maxDicas: 5 }) });
    const r = await setAdminConfig('tok', { maxDicas: 5 });
    expect(r.ok).toBe(true);
    expect(r.data.maxDicas).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- adminApi`
Expected: FAIL (`getAdminConfig`/`setAdminConfig` não existem).

- [ ] **Step 3: Adicionar as funções em `src/services/adminApi.js`**

```js
export async function getAdminConfig(token) {
  return adminRequest('/api/admin/config', token);
}

export async function setAdminConfig(token, patch) {
  return adminRequest('/api/admin/config', token, {
    method: 'PUT',
    body: JSON.stringify(patch)
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- adminApi`
Expected: PASS (12 testes).

- [ ] **Step 5: Implementar `src/professor/ProfessorConfigPage.jsx`**

```jsx
import { useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { getAdminConfig, setAdminConfig } from '../services/adminApi.js';
import Button from '../components/ui/Button.jsx';

const CAMPOS = [
  { name: 'maxDicas', label: 'Máximo de dicas por desafio' },
  { name: 'penalidadePorDica', label: 'Penalidade por dica usada (XP)' },
  { name: 'tempoEntreDicasSeg', label: 'Tempo mínimo entre dicas (segundos)' },
  { name: 'xpBase', label: 'XP base por desafio concluído' },
  { name: 'bonusPrimeira', label: 'Bônus por acertar na primeira tentativa' },
  { name: 'bonusSemDicas', label: 'Bônus por concluir sem usar dicas' },
  { name: 'penalidadeErro', label: 'Penalidade por tentativa incorreta (XP)' },
  { name: 'penalidadeProibido', label: 'Penalidade por usar bloco proibido (XP)' }
];

export default function ProfessorConfigPage() {
  const { token } = useProfessorAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    getAdminConfig(token).then((result) => {
      if (!ativo) return;
      setLoading(false);
      if (result.ok) setForm(result.data);
      else setError(result.error);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const patch = {};
    for (const campo of CAMPOS) patch[campo.name] = Number(form[campo.name]);
    const result = await setAdminConfig(token, patch);
    setSaving(false);
    if (result.ok) {
      setForm(result.data);
      setSaved(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <ProfessorLayout>
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : form ? (
        <form onSubmit={handleSubmit} className="bg-base-panel border border-base-border rounded-xl p-6 max-w-xl">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {CAMPOS.map((campo) => (
              <label key={campo.name} className="flex flex-col gap-1 text-xs text-slate-400">
                {campo.label}
                <input
                  type="number"
                  value={form[campo.name]}
                  onChange={(e) => updateField(campo.name, e.target.value)}
                  className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
            {saved && <span className="text-sm text-emerald-400">Salvo!</span>}
          </div>
        </form>
      ) : null}
    </ProfessorLayout>
  );
}
```

- [ ] **Step 6: Adicionar a rota em `src/professor/ProfessorApp.jsx`**

Adicionar o import `import ProfessorConfigPage from './ProfessorConfigPage.jsx';` e, dentro de `<Routes>`, depois da rota `dashboard`:
```jsx
        <Route
          path="config"
          element={
            <RequireProfessorAuth>
              <ProfessorConfigPage />
            </RequireProfessorAuth>
          }
        />
```

- [ ] **Step 7: Rodar a suíte inteira e o build**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 8: Verificação no navegador**

Com sessão simulada, navegar para `/professor/config`. Confirmar que a tela não quebra mesmo sem backend (mostra o erro), e que a navegação entre as 3 abas do painel (Desafios/Dashboard/Configurações) funciona sem recarregar a página.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(professor): painel de configurações (penalidades, bônus, XP)"
```

---

## Task 7: Verificação end-to-end do painel

**Files:** nenhum arquivo novo — apenas verificação e pequenos ajustes se algo for encontrado.

**Interfaces:** N/A (task de verificação).

- [ ] **Step 1: Rodar a suíte completa e o build**

Run: `npm test`
Expected: PASS (todos os testes das Tasks 1-6).

Run: `npm run build`
Expected: build limpo, sem warnings de rotas ou imports quebrados.

- [ ] **Step 2: Verificação end-to-end no navegador — fluxo do aluno**

1. Abrir `/` — confirmar que a experiência do aluno está intacta (nenhuma regressão da Fase 1/melhorias anteriores).
2. Confirmar que o link "Área do Professor →" aparece no rodapé.

- [ ] **Step 3: Verificação end-to-end no navegador — fluxo do professor (sem backend)**

1. Ir para `/professor` (sem sessão). Tentar logar com qualquer token — confirmar a mensagem de backend não configurado.
2. Confirmar que `/professor/desafios`, `/professor/dashboard`, `/professor/config` (acessadas diretamente pela URL, sem sessão) redirecionam para `/professor`.

- [ ] **Step 4: Verificação end-to-end no navegador — fluxo do professor (sessão simulada)**

Usando `preview_eval` para definir `sessionStorage.setItem('javablocks_professor_token', 'qualquer')` e navegar diretamente para `/professor/desafios`:
1. Confirmar que a sidebar mostra a aba ativa destacada corretamente ao navegar entre Desafios/Dashboard/Configurações.
2. Confirmar que o botão "Sair" limpa a sessão e redireciona para `/professor` (tela de login).
3. Sem erros no console em nenhuma das 3 telas.
4. Testar em largura mobile (`preview_resize` para `mobile`) — confirmar que a sidebar empilha no topo em vez de cortar conteúdo.

- [ ] **Step 5: Corrigir quaisquer problemas encontrados**

Se a verificação acima revelar um bug (ex.: classe Tailwind faltando, import quebrado, redirecionamento incorreto), corrija diretamente no arquivo correspondente das Tasks 1-6 e rode `npm test` + `npm run build` novamente antes de prosseguir.

- [ ] **Step 6: Commit (se houver correções)**

```bash
git add -A
git commit -m "fix(professor): ajustes da verificação end-to-end do painel"
```

(Se nenhuma correção foi necessária, pule este commit — não crie um commit vazio.)

---

## Self-Review (cobertura do spec)

- Aluno sem login, `/` inalterado → Task 2 (nenhuma mudança em `ChallengeContext`/desafios) ✅
- Login do professor por Token Único, reaproveitando `POST /api/admin/verify` → Task 1 (`verifyAdminToken`) + Task 2 (`ProfessorLogin`) ✅
- Sessão em `sessionStorage`, sobrevive a reload, botão Sair → Task 1 (`ProfessorAuthProvider`) + Task 4 (`ProfessorLayout` botão Sair) ✅
- Rotas reais (`/`, `/professor`, `/professor/desafios`, `/professor/dashboard`, `/professor/config`) → Task 2 (`ProfessorApp`, `App.jsx`) + Tasks 4/5/6 (rotas adicionadas incrementalmente) ✅
- Bloqueio claro sem backend configurado → Task 1 (`adminRequest`/`verifyAdminToken`) verificado em Task 2/7 ✅
- Painel completo: CRUD de desafios + Dashboard + Configurações → Tasks 4, 5, 6 ✅
- Identidade visual distinta (sidebar, `adminAccent`) → Task 2 (tailwind.config) + Task 4 (`ProfessorLayout`) ✅
- Link discreto "Área do Professor →" no rodapé do aluno → Task 2 ✅
- Testes: `adminApi`, `ProfessorAuthProvider`, `RequireProfessorAuth`, validação do formulário → Tasks 1, 2, 4 ✅
- Fora de escopo (multi-usuário, tempo real, drag-and-drop no painel) → não implementado, conforme spec ✅
