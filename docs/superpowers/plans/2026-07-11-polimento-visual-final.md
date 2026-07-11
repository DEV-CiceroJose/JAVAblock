# Polimento Visual Final — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aprofundar a qualidade visual do JavaBlocks (app do aluno + painel do professor) com um motivo gráfico de "blocos" aplicado pontualmente, tipografia monoespaçada em destaques, e micro-interações refinadas — sem alterar nenhuma lógica, dado ou fluxo existente.

**Architecture:** Trabalho puramente presentational. Dois componentes reutilizáveis novos (`BlockPattern`, `EmptyState`) em `src/components/ui/`, aplicados em 7 pontos-chave já mapeados no spec. Tokens novos no Tailwind (fonte mono) e no CSS global (scrollbar). Nenhum teste automatizado novo — verificação é build limpo + inspeção visual no navegador (desktop e mobile) a cada task.

**Tech Stack:** React 18 + Vite + Tailwind + Framer Motion (já no projeto). Fonte `JetBrains Mono` via Google Fonts.

## Global Constraints

- Puramente visual/presentational — ZERO mudança de lógica, dados, navegação, ou comportamento funcional. Nenhum teste existente pode quebrar.
- Paleta mantém a base atual: `base-bg #0f1117`, `base-panel #171a23`, `base-border #262a36`, `accent #4f8cff` (aluno), `adminAccent #8b5cf6` (professor). Não introduzir cores novas fora dessas.
- O motivo de blocos (`BlockPattern`) é aplicado APENAS nos 7 pontos-chave listados — nunca nas 3 colunas do editor do aluno nem na tabela de desafios do professor.
- `font-mono` (JetBrains Mono) só em títulos de tela, números de XP/estatísticas e rótulos — nunca em texto corrido (descrições, formulários).
- Tema exclusivamente escuro — não implementar tema claro.
- Cada task termina com: `npm test` (sem regressão), `npm run build` (limpo), e verificação visual no navegador das telas tocadas.

---

## Task 1: Fundação (fonte, favicon, scrollbar)

**Files:**
- Modify: `index.html`
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: classe utilitária `font-mono` do Tailwind passa a resolver para `JetBrains Mono` (com fallback); favicon servido em `/favicon.svg`; scrollbar customizada aplicada globalmente.

- [ ] **Step 1: Criar o favicon**

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="3" y="3" width="12" height="12" rx="3" fill="#4f8cff"/>
  <rect x="17" y="17" width="12" height="12" rx="3" fill="#8b5cf6"/>
  <rect x="17" y="3" width="12" height="12" rx="3" fill="#171a23" stroke="#4f8cff" stroke-width="1.5"/>
  <rect x="3" y="17" width="12" height="12" rx="3" fill="#171a23" stroke="#8b5cf6" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 2: Adicionar a fonte e o favicon em `index.html`**

Substituir o conteúdo do `<head>` por:
```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="Cicero José" />
    <!-- © 2026 Cicero José. Todos os direitos reservados. -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap"
      rel="stylesheet"
    />
    <title>JavaBlocks</title>
  </head>
```

- [ ] **Step 3: Adicionar `font-mono` ao Tailwind**

Em `tailwind.config.js`, dentro de `theme.extend`, adicionar `fontFamily` ao lado de `colors`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: { bg: '#0f1117', panel: '#171a23', border: '#262a36' },
        accent: { DEFAULT: '#4f8cff', hover: '#3a76e8' },
        adminAccent: { DEFAULT: '#8b5cf6', hover: '#7c3aed' }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 4: Scrollbar customizada em `src/index.css`**

Substituir o conteúdo por:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
html, body, #root { height: 100%; }
body { @apply bg-base-bg text-slate-100; margin: 0; font-family: system-ui, sans-serif; }

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: #262a36;
  border-radius: 8px;
  border: 2px solid #0f1117;
}
::-webkit-scrollbar-thumb:hover {
  background-color: #3a3f4f;
}
* {
  scrollbar-width: thin;
  scrollbar-color: #262a36 transparent;
}
```

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm test`
Expected: PASS (60 testes, sem regressão — este é um passo puramente de config/CSS/HTML).

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 6: Verificação no navegador**

Abrir o app no preview: confirmar que a aba do navegador mostra o novo favicon (dois quadrados coloridos), que a fonte `JetBrains Mono` carrega (checar na aba Network ou `document.fonts` via console: nenhuma classe visível ainda usa `font-mono`, então não há mudança visual perceptível aqui — só confirmar que não há erro 404 no carregamento da fonte/favicon).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(polimento): fonte JetBrains Mono, favicon e scrollbar customizada"
```

---

## Task 2: Componentes reutilizáveis — `BlockPattern` e `EmptyState`

**Files:**
- Create: `src/components/ui/BlockPattern.jsx`
- Create: `src/components/ui/EmptyState.jsx`

**Interfaces:**
- Produces: `<BlockPattern color="#4f8cff" opacity={0.06} className="" />` — SVG decorativo absoluto, preenche o elemento pai (que deve ter `relative overflow-hidden`), `pointer-events-none`, não interfere em cliques. `<EmptyState title="..." description="..." />` — ilustração SVG pequena + texto centralizado.

- [ ] **Step 1: Implementar `src/components/ui/BlockPattern.jsx`**

```jsx
import { useId } from 'react';

export default function BlockPattern({ className = '', color = '#4f8cff', opacity = 0.08 }) {
  const patternId = useId();

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
          <rect x="4" y="4" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M22 13 h10" stroke={color} strokeWidth="1.5" />
          <rect x="34" y="4" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M13 22 v10" stroke={color} strokeWidth="1.5" />
          <rect x="4" y="34" width="18" height="18" rx="4" fill="none" stroke={color} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
```

Nota: `useId()` garante um id único por instância, evitando colisão de `<pattern id="...">` quando duas instâncias de `BlockPattern` estiverem montadas ao mesmo tempo (ex.: `ChallengeHeader` + `SuccessOverlay` simultaneamente na tela do aluno).

- [ ] **Step 2: Implementar `src/components/ui/EmptyState.jsx`**

```jsx
export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <svg viewBox="0 0 96 64" className="w-24 h-16 mb-3 text-slate-600" fill="none" aria-hidden="true">
        <rect x="6" y="8" width="26" height="26" rx="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="64" y="30" width="26" height="26" rx="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M32 21 L46 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
        <path d="M64 43 L50 43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
      </svg>
      <p className="text-sm text-slate-400">{title}</p>
      {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Rodar a suíte e o build**

Run: `npm test`
Expected: PASS (60 testes — nenhum componente existente foi tocado, estes são arquivos novos e não importados ainda em lugar nenhum).

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(polimento): componentes reutilizáveis BlockPattern e EmptyState"
```

---

## Task 3: App do aluno — cabeçalho, ranking, sucesso, estado vazio

**Files:**
- Modify: `src/aluno/ChallengeHeader.jsx`
- Modify: `src/aluno/RankingPanel.jsx`
- Modify: `src/aluno/SuccessOverlay.jsx`
- Modify: `src/aluno/Workspace.jsx`

**Interfaces:**
- Consumes: `BlockPattern`, `EmptyState` (Task 2).

- [ ] **Step 1: `src/aluno/ChallengeHeader.jsx`**

Substituir o conteúdo por:
```jsx
import Badge from '../components/ui/Badge';
import BlockPattern from '../components/ui/BlockPattern.jsx';

export default function ChallengeHeader({ challenge }) {
  if (!challenge) return null;

  return (
    <div className="relative overflow-hidden bg-base-panel border border-base-border rounded-xl p-4 mb-4">
      <BlockPattern color="#4f8cff" opacity={0.06} />
      <div className="relative">
        <h1 className="text-xl font-bold font-mono text-slate-100 mb-2">{challenge.titulo}</h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">{challenge.descricao}</p>
        <Badge color="#4f8cff">{challenge.objetivoPedagogico}</Badge>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/aluno/RankingPanel.jsx`**

Alterar apenas a linha do XP (dentro do `<motion.li>`), de:
```jsx
              <span className="text-xs text-slate-400">{grupo.xp} XP</span>
```
para:
```jsx
              <span className="text-xs text-slate-400 font-mono">{grupo.xp} XP</span>
```

- [ ] **Step 3: `src/aluno/SuccessOverlay.jsx`**

Substituir o conteúdo por:
```jsx
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/ui/Button';
import BlockPattern from '../components/ui/BlockPattern.jsx';

export default function SuccessOverlay({ open, xp = 0, onNext, isLast = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative overflow-hidden bg-base-panel border border-base-border rounded-2xl max-w-md w-full p-8 text-center"
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <BlockPattern color="#4f8cff" opacity={0.07} />
            <div className="relative">
              <motion.div
                className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M4 12.5 L9.5 18 L20 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              <motion.h2
                className="text-xl font-bold text-slate-100 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Parabéns! Você concluiu este desafio.
              </motion.h2>

              <motion.p
                className="text-3xl font-extrabold font-mono text-accent mb-6"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.45 }}
              >
                +{xp} XP
              </motion.p>

              <Button variant="success" className="w-full" onClick={onNext}>
                {isLast ? 'Você concluiu todos os desafios!' : 'Próximo Desafio'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: `src/aluno/Workspace.jsx`**

Adicionar o import no topo (junto aos demais):
```jsx
import EmptyState from '../components/ui/EmptyState.jsx';
```

E trocar o bloco do estado vazio, de:
```jsx
        {instances.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-center text-sm text-slate-500 border border-dashed border-base-border rounded-md">
            Arraste blocos aqui para montar seu programa
          </div>
        ) : (
```
para:
```jsx
        {instances.length === 0 ? (
          <div className="h-40 flex items-center justify-center border border-dashed border-base-border rounded-md">
            <EmptyState title="Arraste blocos aqui para montar seu programa" />
          </div>
        ) : (
```

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm test`
Expected: PASS (60 testes, sem regressão).

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 6: Verificação no navegador**

Abrir `/`, confirmar visualmente:
1. O cabeçalho do desafio (`ChallengeHeader`) mostra o padrão de blocos sutil ao fundo e o título em fonte monoespaçada.
2. Os números de XP no ranking (`RankingPanel`) estão em fonte monoespaçada.
3. O workspace vazio mostra a nova ilustração de blocos desconectados em vez do texto solto.
4. Resolver um desafio (ou simular via preview) e confirmar que o `SuccessOverlay` mostra o padrão de fundo no cartão e o "+XP" em fonte monoespaçada, sem quebrar a animação existente.
5. Sem erros no console.
6. Testar em largura mobile — nada quebra ou estoura horizontalmente.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(polimento): app do aluno — cabeçalho, ranking, sucesso e estado vazio"
```

---

## Task 4: Painel do professor — login, sidebar, estado vazio, transições

**Files:**
- Modify: `src/professor/ProfessorLogin.jsx`
- Modify: `src/professor/ProfessorLayout.jsx`
- Modify: `src/professor/ProfessorChallengesPage.jsx`

**Interfaces:**
- Consumes: `BlockPattern`, `EmptyState` (Task 2).

- [ ] **Step 1: `src/professor/ProfessorLogin.jsx`**

Substituir o conteúdo por:
```jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import Button from '../components/ui/Button.jsx';
import BlockPattern from '../components/ui/BlockPattern.jsx';

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
        className="relative overflow-hidden w-full max-w-sm bg-base-panel border border-base-border rounded-2xl p-6 shadow-xl"
      >
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)' }}
        />
        <BlockPattern color="#8b5cf6" opacity={0.06} />
        <div className="relative">
          <h1 className="text-xl font-bold font-mono mb-1">Área do Professor</h1>
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
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: `src/professor/ProfessorLayout.jsx`**

Substituir o conteúdo por:
```jsx
import { motion } from 'framer-motion';
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
        <div className="relative overflow-hidden px-5 py-5 border-b border-base-border">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top left, rgba(139,92,246,0.15), transparent 70%)' }}
          />
          <div className="relative">
            <span className="text-xs uppercase tracking-wide text-slate-500">JavaBlocks</span>
            <h1 className="text-lg font-bold font-mono text-adminAccent">Painel do Professor</h1>
          </div>
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
      <main className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
```

Nota: `ProfessorLayout` é renderizado de novo (remonta por inteiro) a cada troca de rota entre `/professor/desafios`, `/professor/dashboard` e `/professor/config`, porque cada página o instancia individualmente. Isso faz a animação `initial`→`animate` do `<motion.div>` disparar naturalmente a cada troca de aba, sem precisar de nenhuma prop `key` adicional.

- [ ] **Step 3: `src/professor/ProfessorChallengesPage.jsx`**

Adicionar o import no topo (junto aos demais):
```jsx
import EmptyState from '../components/ui/EmptyState.jsx';
```

E trocar a linha do estado vazio, de:
```jsx
      ) : sorted.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhum desafio cadastrado ainda.</p>
      ) : (
```
para:
```jsx
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Nenhum desafio cadastrado ainda."
          description='Clique em "Novo Desafio" para começar.'
        />
      ) : (
```

- [ ] **Step 4: Rodar a suíte e o build**

Run: `npm test`
Expected: PASS (60 testes, sem regressão).

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 5: Verificação no navegador**

Com `sessionStorage.setItem('javablocks_professor_token', 'qualquer')` simulado, navegar por `/professor`, `/professor/desafios`, `/professor/dashboard`, `/professor/config`:
1. Tela de login: padrão de blocos + brilho radial roxo visíveis atrás do cartão, título "Área do Professor" em fonte monoespaçada.
2. Sidebar: cabeçalho "Painel do Professor" em fonte monoespaçada com leve gradiente de fundo.
3. Trocar de aba (Desafios → Dashboard → Configurações) e observar a animação de entrada suave do conteúdo a cada troca.
4. Se não houver desafios cadastrados (backend indisponível ou lista vazia), a tela de Desafios mostra a nova ilustração de estado vazio.
5. Sem erros no console.
6. Testar em largura mobile — sidebar empilha corretamente, sem overflow horizontal.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(polimento): painel do professor — login, sidebar e estado vazio"
```

---

## Task 5: Polimento geral (botões, cartões) e verificação final

**Files:**
- Modify: `src/components/ui/Button.jsx`
- Modify: `src/components/ui/Card.jsx`

**Interfaces:** nenhuma nova — só ajuste visual dos primitivos já usados em todo o app.

- [ ] **Step 1: `src/components/ui/Button.jsx`**

Substituir o conteúdo por:
```jsx
const styles = {
  primary: 'bg-accent hover:bg-accent-hover text-white hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02]',
  ghost: 'bg-transparent border border-base-border hover:bg-base-panel text-slate-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02]'
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:hover:scale-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-bg
        focus-visible:ring-accent ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 2: `src/components/ui/Card.jsx`**

Substituir o conteúdo por:
```jsx
export default function Card({ className = '', ...props }) {
  return (
    <div
      className={`bg-base-panel border border-base-border rounded-xl shadow-md shadow-black/20 ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Rodar a suíte e o build**

Run: `npm test`
Expected: PASS (60 testes, sem regressão).

Run: `npm run build`
Expected: build limpo.

- [ ] **Step 4: Verificação visual completa (desktop + mobile)**

Percorrer TODAS as telas tocadas neste plano, em largura desktop e depois mobile:
1. App do aluno (`/`): cabeçalho, biblioteca/workspace/código, ranking, botões da barra de ações (hover mostra leve crescimento + sombra colorida), overlay de sucesso.
2. Painel do professor: login, sidebar + as 3 abas (Desafios com CRUD/estado vazio, Dashboard, Configurações), botão "Sair".
3. Confirmar que nenhum botão/cartão quebrou visualmente (texto cortado, sombra vazando do container, scale empurrando layout).
4. Confirmar que o foco por teclado (Tab) nos botões mostra o novo anel de foco visível.
5. Sem erros no console em nenhuma tela.

- [ ] **Step 5: Corrigir quaisquer problemas encontrados**

Se a verificação revelar um problema visual (ex.: sombra cortada por `overflow-hidden` de um container pai, texto ilegível sobre o padrão de fundo), ajuste diretamente no arquivo correspondente das Tasks 1-5 e repita a verificação do passo anterior.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(polimento): micro-interações em botões e cartões + verificação visual final"
```

(Se o Step 5 não exigiu nenhuma correção, este commit cobre só os Steps 1-2.)

---

## Self-Review (cobertura do spec)

- Paleta mantida, sem cores novas → todas as tasks reutilizam `accent`/`adminAccent`/`base-*` ✅
- Motivo de blocos pontual (não difuso) → aplicado só nos 7 pontos-chave da seção 3 do spec (Tasks 3 e 4); colunas do editor e tabela de desafios não tocadas ✅
- Tipografia mono em títulos/XP/rótulos, nunca em texto corrido → Tasks 1, 3, 4 ✅
- `BlockPattern`/`EmptyState` reutilizáveis → Task 2 ✅
- Micro-interações (hover/foco em botões, sombra em cartões, transições de aba, scrollbar, favicon) → Tasks 1, 4, 5 ✅
- Zero mudança de lógica/dados/navegação/testes → nenhuma task toca em `context/`, `engine/`, `gamification/`, `services/`, ou testes existentes; `npm test` roda inalterado (60 testes) em toda task ✅
- Verificação por inspeção visual (não testes automatizados novos) → explícito em cada task ✅
- Fora de escopo (paleta nova, motivo difuso, tema claro) → não implementado, conforme spec ✅
