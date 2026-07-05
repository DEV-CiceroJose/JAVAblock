# JavaBlocks — App do Aluno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o app do aluno do JavaBlocks — editor visual de blocos que gera código Java ao vivo, com 2 desafios integradores, validação pedagógica, dicas, XP e ranking, rodando 100% no navegador.

**Architecture:** App React (Vite) single-page. Uma camada pura de "engine" (geração de código Java + validação + pontuação) testada com Vitest. Dados (blocos e desafios) em arquivos JS. Estado de progresso/XP em `localStorage`. UI em três colunas com drag-and-drop via Dnd Kit e animações Framer Motion.

**Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, @dnd-kit/core, Vitest.

## Global Constraints

- JavaScript moderno (ESM), sem TypeScript.
- Tema escuro; blocos coloridos por categoria; totalmente responsivo.
- Mensagens de validação SEMPRE pedagógicas — nunca "Resposta incorreta." isolado.
- Nenhuma dependência de rede/Firebase nesta fase; tudo local.
- Toda função de `engine/` é pura (sem acesso a DOM/localStorage) e testável isoladamente.
- Estrutura de pastas conforme spec: `src/aluno`, `src/data`, `src/engine`, `src/gamification`, `src/components/ui`, `src/hooks`, `src/context`, `src/utils`.
- Português nos textos de UI e conteúdo.

---

## Modelo de dados (compartilhado por todas as tasks)

**Definição de bloco** (`data/blocks.js`):
```js
{
  id: 'print',              // único
  category: 'saida',        // chave de categoria (cor/agrupamento)
  label: 'System.out.println()',
  container: false,         // true = aceita blocos-filho
  fields: [                 // campos editáveis (pode ser [])
    { name: 'text', label: 'Texto', default: '"Olá"' }
  ],
  template: 'System.out.println({text});' // {field} são substituídos
}
```

**Instância de bloco no workspace** (estado da UI):
```js
{
  instanceId: 'uuid',       // único por instância
  blockId: 'print',         // referencia a definição
  fields: { text: '"Olá"' },// valores atuais
  children: []              // instâncias-filho (só relevante se container)
}
```

**Desafio** (`data/challenges.js`):
```js
{
  id: 'cadastro-seguro',
  titulo: 'Cadastro Seguro de Alunos',
  descricao: '...',           // linguagem de aluno, explica o problema
  objetivoPedagogico: '...',
  blocosPermitidos: ['string', 'arraylist_criar', ...], // ids liberados na biblioteca
  regras: {
    obrigatorios: ['arraylist_criar', 'try', 'catch', 'filewriter'],
    proibidos: [],
    ordem: [['arraylist_criar', 'arraylist_add'], ['try', 'catch']], // pares "A antes de B"
    quantidadeMinima: 4
  },
  dicas: ['conceito...', 'quais blocos...', 'ordem parcial...']
}
```

---

## Task 1: Scaffold do projeto Vite + Tailwind + Vitest

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- Create: `vitest.config.js`
- Test: `src/engine/__tests__/smoke.test.js`

**Interfaces:**
- Produces: projeto que roda com `npm run dev` e testa com `npm test`.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "javablocks-aluno",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.3.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Criar arquivos de config**

`vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```

`vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: { bg: '#0f1117', panel: '#171a23', border: '#262a36' },
        accent: { DEFAULT: '#4f8cff', hover: '#3a76e8' }
      }
    }
  },
  plugins: []
};
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 3: Criar `index.html`, `src/index.css`, `src/main.jsx`, `src/App.jsx`**

`index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JavaBlocks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
html, body, #root { height: 100%; }
body { @apply bg-base-bg text-slate-100; margin: 0; font-family: system-ui, sans-serif; }
```

`src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

`src/App.jsx`:
```jsx
export default function App() {
  return <div className="p-6 text-2xl font-bold">JavaBlocks</div>;
}
```

- [ ] **Step 4: Escrever teste smoke**

`src/engine/__tests__/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('roda o vitest', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Instalar e rodar**

Run: `npm install && npm test`
Expected: 1 teste PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Tailwind + Vitest"
```

---

## Task 2: Catálogo de blocos (`data/blocks.js`)

**Files:**
- Create: `src/data/blocks.js`
- Test: `src/data/__tests__/blocks.test.js`

**Interfaces:**
- Produces: `BLOCKS` (array de definições) e `CATEGORIES` (array `{ key, label, color }`); helper `getBlock(id)`.

- [ ] **Step 1: Escrever o teste**

`src/data/__tests__/blocks.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { BLOCKS, CATEGORIES, getBlock } from '../blocks.js';

describe('blocks', () => {
  it('todo bloco tem id, category, label, template', () => {
    for (const b of BLOCKS) {
      expect(b.id).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.label).toBeTruthy();
      expect(typeof b.template).toBe('string');
    }
  });
  it('ids são únicos', () => {
    const ids = BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('toda category usada existe em CATEGORIES', () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    for (const b of BLOCKS) expect(keys.has(b.category)).toBe(true);
  });
  it('getBlock devolve a definição', () => {
    expect(getBlock('print').label).toContain('println');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- blocks`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `src/data/blocks.js`**

Definir `CATEGORIES` com as chaves: `variaveis`, `entrada`, `saida`, `condicoes`, `repeticoes`, `excecoes`, `arraylist`, `hashset`, `hashmap`, `arquivos` (cada uma com `label` e `color` hex distinta). Definir `BLOCKS` cobrindo todos os blocos do spec. Blocos-container (`container: true`): `if`, `else`, `for`, `while`, `try`, `catch`, `finally`. Exemplos representativos:

```js
export const CATEGORIES = [
  { key: 'variaveis', label: 'Variáveis', color: '#e0654f' },
  { key: 'entrada',   label: 'Entrada',   color: '#e08a4f' },
  { key: 'saida',     label: 'Saída',     color: '#e0c14f' },
  { key: 'condicoes', label: 'Condições', color: '#7fbf4f' },
  { key: 'repeticoes',label: 'Repetições',color: '#4fbf9f' },
  { key: 'excecoes',  label: 'Exceções',  color: '#4f9cbf' },
  { key: 'arraylist', label: 'ArrayList', color: '#6f6fe0' },
  { key: 'hashset',   label: 'HashSet',   color: '#9f5fe0' },
  { key: 'hashmap',   label: 'HashMap',   color: '#d15fe0' },
  { key: 'arquivos',  label: 'Arquivos',  color: '#e05f9f' }
];

export const BLOCKS = [
  // Variáveis
  { id: 'var_string', category: 'variaveis', label: 'String', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'texto' }, { name: 'valor', label: 'valor', default: '""' }],
    template: 'String {nome} = {valor};' },
  { id: 'var_int', category: 'variaveis', label: 'int', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'numero' }, { name: 'valor', label: 'valor', default: '0' }],
    template: 'int {nome} = {valor};' },
  { id: 'var_double', category: 'variaveis', label: 'double', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'valor' }, { name: 'valor', label: 'valor', default: '0.0' }],
    template: 'double {nome} = {valor};' },
  // Entrada
  { id: 'scanner', category: 'entrada', label: 'Scanner', container: false, fields: [],
    template: 'Scanner sc = new Scanner(System.in);' },
  { id: 'ler_texto', category: 'entrada', label: 'Ler Texto', container: false,
    fields: [{ name: 'nome', label: 'variável', default: 'texto' }],
    template: 'String {nome} = sc.nextLine();' },
  { id: 'ler_numero', category: 'entrada', label: 'Ler Número', container: false,
    fields: [{ name: 'nome', label: 'variável', default: 'numero' }],
    template: 'int {nome} = sc.nextInt();' },
  // Saída
  { id: 'print', category: 'saida', label: 'System.out.println()', container: false,
    fields: [{ name: 'text', label: 'texto', default: '"Olá"' }],
    template: 'System.out.println({text});' },
  // Condições
  { id: 'if', category: 'condicoes', label: 'if', container: true,
    fields: [{ name: 'cond', label: 'condição', default: 'x > 0' }],
    template: 'if ({cond}) {' },
  { id: 'else', category: 'condicoes', label: 'else', container: true, fields: [],
    template: 'else {' },
  // Repetições
  { id: 'for', category: 'repeticoes', label: 'for', container: true,
    fields: [{ name: 'init', label: 'início', default: 'int i = 0' }, { name: 'cond', label: 'condição', default: 'i < 10' }, { name: 'inc', label: 'passo', default: 'i++' }],
    template: 'for ({init}; {cond}; {inc}) {' },
  { id: 'while', category: 'repeticoes', label: 'while', container: true,
    fields: [{ name: 'cond', label: 'condição', default: 'true' }],
    template: 'while ({cond}) {' },
  // Exceções
  { id: 'try', category: 'excecoes', label: 'try', container: true, fields: [], template: 'try {' },
  { id: 'catch', category: 'excecoes', label: 'catch (Exception e)', container: true, fields: [],
    template: 'catch (Exception e) {' },
  { id: 'finally', category: 'excecoes', label: 'finally', container: true, fields: [], template: 'finally {' },
  { id: 'throw', category: 'excecoes', label: 'throw new Exception()', container: false,
    fields: [{ name: 'msg', label: 'mensagem', default: '"Erro"' }],
    template: 'throw new Exception({msg});' },
  // ArrayList
  { id: 'arraylist_criar', category: 'arraylist', label: 'Criar Lista', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'lista' }],
    template: 'ArrayList<String> {nome} = new ArrayList<>();' },
  { id: 'arraylist_add', category: 'arraylist', label: 'Adicionar Elemento', container: false,
    fields: [{ name: 'nome', label: 'lista', default: 'lista' }, { name: 'valor', label: 'valor', default: '"Ana"' }],
    template: '{nome}.add({valor});' },
  { id: 'arraylist_remover', category: 'arraylist', label: 'Remover Elemento', container: false,
    fields: [{ name: 'nome', label: 'lista', default: 'lista' }, { name: 'valor', label: 'valor', default: '0' }],
    template: '{nome}.remove({valor});' },
  { id: 'arraylist_mostrar', category: 'arraylist', label: 'Mostrar Lista', container: false,
    fields: [{ name: 'nome', label: 'lista', default: 'lista' }],
    template: 'System.out.println({nome});' },
  // HashSet
  { id: 'hashset_criar', category: 'hashset', label: 'Criar Conjunto', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'conjunto' }],
    template: 'HashSet<String> {nome} = new HashSet<>();' },
  { id: 'hashset_add', category: 'hashset', label: 'Adicionar Elemento', container: false,
    fields: [{ name: 'nome', label: 'conjunto', default: 'conjunto' }, { name: 'valor', label: 'valor', default: '"A"' }],
    template: '{nome}.add({valor});' },
  { id: 'hashset_mostrar', category: 'hashset', label: 'Mostrar Conjunto', container: false,
    fields: [{ name: 'nome', label: 'conjunto', default: 'conjunto' }],
    template: 'System.out.println({nome});' },
  // HashMap
  { id: 'hashmap_criar', category: 'hashmap', label: 'Criar Mapa', container: false,
    fields: [{ name: 'nome', label: 'nome', default: 'mapa' }],
    template: 'HashMap<String, Integer> {nome} = new HashMap<>();' },
  { id: 'hashmap_add', category: 'hashmap', label: 'Adicionar Chave/Valor', container: false,
    fields: [{ name: 'nome', label: 'mapa', default: 'mapa' }, { name: 'chave', label: 'chave', default: '"Ana"' }, { name: 'valor', label: 'valor', default: '10' }],
    template: '{nome}.put({chave}, {valor});' },
  { id: 'hashmap_buscar', category: 'hashmap', label: 'Buscar Chave', container: false,
    fields: [{ name: 'nome', label: 'mapa', default: 'mapa' }, { name: 'chave', label: 'chave', default: '"Ana"' }],
    template: 'System.out.println({nome}.get({chave}));' },
  { id: 'hashmap_mostrar', category: 'hashmap', label: 'Mostrar Mapa', container: false,
    fields: [{ name: 'nome', label: 'mapa', default: 'mapa' }],
    template: 'System.out.println({nome});' },
  // Arquivos
  { id: 'filereader', category: 'arquivos', label: 'FileReader', container: false,
    fields: [{ name: 'arquivo', label: 'arquivo', default: '"alunos.txt"' }],
    template: 'FileReader fr = new FileReader({arquivo});' },
  { id: 'bufferedreader', category: 'arquivos', label: 'BufferedReader', container: false, fields: [],
    template: 'BufferedReader br = new BufferedReader(fr);' },
  { id: 'ler_linha', category: 'arquivos', label: 'Ler Linha', container: false,
    fields: [{ name: 'nome', label: 'variável', default: 'linha' }],
    template: 'String {nome} = br.readLine();' },
  { id: 'filewriter', category: 'arquivos', label: 'FileWriter', container: false,
    fields: [{ name: 'arquivo', label: 'arquivo', default: '"notas.txt"' }],
    template: 'FileWriter fw = new FileWriter({arquivo});' },
  { id: 'bufferedwriter', category: 'arquivos', label: 'BufferedWriter', container: false, fields: [],
    template: 'BufferedWriter bw = new BufferedWriter(fw);' },
  { id: 'escrever_arquivo', category: 'arquivos', label: 'Escrever Arquivo', container: false,
    fields: [{ name: 'texto', label: 'texto', default: '"Olá"' }],
    template: 'bw.write({texto});' },
  { id: 'fechar_arquivo', category: 'arquivos', label: 'Fechar Arquivo', container: false,
    fields: [{ name: 'recurso', label: 'recurso', default: 'bw' }],
    template: '{recurso}.close();' }
];

export function getBlock(id) {
  return BLOCKS.find((b) => b.id === id);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- blocks`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(data): catálogo completo de blocos"
```

---

## Task 3: Gerador de código Java (`engine/codeGenerator.js`)

**Files:**
- Create: `src/engine/codeGenerator.js`
- Test: `src/engine/__tests__/codeGenerator.test.js`

**Interfaces:**
- Consumes: `getBlock(id)` de `data/blocks.js`; instâncias `{ instanceId, blockId, fields, children }`.
- Produces: `generateJava(instances) -> { code: string, lines: Array<{ text, instanceId|null }> }`. `code` é o join das `lines` por `\n`. Container vazio gera linha `// Falta completar aqui`.

- [ ] **Step 1: Escrever o teste**

`src/engine/__tests__/codeGenerator.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { generateJava } from '../codeGenerator.js';

const inst = (blockId, fields = {}, children = []) =>
  ({ instanceId: blockId + '-1', blockId, fields, children });

describe('generateJava', () => {
  it('envolve em class Main + main', () => {
    const { code } = generateJava([]);
    expect(code).toContain('public class Main');
    expect(code).toContain('public static void main(String[] args)');
  });

  it('gera bloco simples substituindo campos', () => {
    const { code } = generateJava([inst('print', { text: '"Oi"' })]);
    expect(code).toContain('System.out.println("Oi");');
  });

  it('container vazio recebe marcador de falta', () => {
    const { code } = generateJava([inst('try', {}, [])]);
    expect(code).toContain('try {');
    expect(code).toContain('// Falta completar aqui');
    expect(code).toContain('}');
  });

  it('container com filhos indenta os filhos', () => {
    const { code } = generateJava([
      inst('try', {}, [inst('print', { text: '"x"' })])
    ]);
    const linhas = code.split('\n');
    const idxPrint = linhas.findIndex((l) => l.includes('println'));
    expect(linhas[idxPrint].startsWith('      ')).toBe(true); // indentado dentro de main+try
  });

  it('cada linha de conteúdo mapeia para seu instanceId', () => {
    const { lines } = generateJava([inst('print', { text: '"Oi"' })]);
    const linha = lines.find((l) => l.text.includes('println'));
    expect(linha.instanceId).toBe('print-1');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- codeGenerator`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/engine/codeGenerator.js`**

```js
import { getBlock } from '../data/blocks.js';

const INDENT = '  ';

function fillTemplate(template, fields = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    fields[k] !== undefined && fields[k] !== '' ? fields[k] : `/*${k}*/`
  );
}

// Devolve array de { text, instanceId }
function emit(instances, depth) {
  const pad = INDENT.repeat(depth);
  const out = [];
  for (const node of instances) {
    const def = getBlock(node.blockId);
    if (!def) continue;
    if (def.container) {
      out.push({ text: pad + fillTemplate(def.template, node.fields), instanceId: node.instanceId });
      if (!node.children || node.children.length === 0) {
        out.push({ text: pad + INDENT + '// Falta completar aqui', instanceId: node.instanceId });
      } else {
        out.push(...emit(node.children, depth + 1));
      }
      out.push({ text: pad + '}', instanceId: node.instanceId });
    } else {
      out.push({ text: pad + fillTemplate(def.template, node.fields), instanceId: node.instanceId });
    }
  }
  return out;
}

export function generateJava(instances) {
  const header = [
    { text: 'public class Main {', instanceId: null },
    { text: INDENT + 'public static void main(String[] args) {', instanceId: null }
  ];
  const body = emit(instances || [], 2);
  const footer = [
    { text: INDENT + '}', instanceId: null },
    { text: '}', instanceId: null }
  ];
  const lines = [...header, ...body, ...footer];
  return { code: lines.map((l) => l.text).join('\n'), lines };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- codeGenerator`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): gerador de código Java com mapa de linhas"
```

---

## Task 4: Desafios (`data/challenges.js`)

**Files:**
- Create: `src/data/challenges.js`
- Test: `src/data/__tests__/challenges.test.js`

**Interfaces:**
- Consumes: ids de `BLOCKS`.
- Produces: `CHALLENGES` (array) e `getChallenge(id)`. Cada desafio segue o modelo de dados de "Desafio" acima.

- [ ] **Step 1: Escrever o teste**

`src/data/__tests__/challenges.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { CHALLENGES, getChallenge } from '../challenges.js';
import { getBlock } from '../blocks.js';

describe('challenges', () => {
  it('tem 2 desafios', () => { expect(CHALLENGES.length).toBe(2); });
  it('todo desafio tem campos pedagógicos', () => {
    for (const c of CHALLENGES) {
      expect(c.titulo).toBeTruthy();
      expect(c.descricao.length).toBeGreaterThan(30);
      expect(c.objetivoPedagogico).toBeTruthy();
      expect(c.dicas.length).toBe(3);
      expect(c.regras.obrigatorios.length).toBeGreaterThan(0);
    }
  });
  it('todos os ids referenciados existem', () => {
    for (const c of CHALLENGES) {
      for (const id of [...c.blocosPermitidos, ...c.regras.obrigatorios, ...c.regras.proibidos]) {
        expect(getBlock(id), `bloco ${id}`).toBeTruthy();
      }
    }
  });
  it('getChallenge funciona', () => {
    expect(getChallenge(CHALLENGES[0].id)).toBe(CHALLENGES[0]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- challenges`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/data/challenges.js`**

Dois desafios integradores, descrições em linguagem de aluno explicando o problema (não só quais blocos). `blocosPermitidos` inclui a biblioteca ampla; `regras` conforme o modelo.

```js
export const CHALLENGES = [
  {
    id: 'cadastro-seguro',
    titulo: 'Cadastro Seguro de Alunos',
    descricao:
      'A secretaria da escola precisa de um programa que guarde o nome de alguns ' +
      'alunos e salve essa lista em um arquivo. Como a pessoa pode digitar algo ' +
      'errado, o programa não pode quebrar: use try, catch e finally para proteger. ' +
      'Crie uma lista com ArrayList, adicione alguns nomes e, por fim, escreva a ' +
      'lista no arquivo alunos.txt usando FileWriter e BufferedWriter.',
    objetivoPedagogico:
      'Integrar Collections (ArrayList), Tratamento de Exceções e escrita de Arquivos.',
    blocosPermitidos: [
      'var_string', 'print', 'arraylist_criar', 'arraylist_add', 'arraylist_mostrar',
      'try', 'catch', 'finally', 'throw', 'filewriter', 'bufferedwriter',
      'escrever_arquivo', 'fechar_arquivo', 'hashset_criar'
    ],
    regras: {
      obrigatorios: ['arraylist_criar', 'arraylist_add', 'try', 'catch', 'filewriter', 'escrever_arquivo'],
      proibidos: [],
      ordem: [
        ['arraylist_criar', 'arraylist_add'],
        ['try', 'catch'],
        ['filewriter', 'escrever_arquivo']
      ],
      quantidadeMinima: 6
    },
    dicas: [
      'Pense em três etapas: guardar os nomes, proteger contra erros e salvar em arquivo.',
      'Você provavelmente vai usar: Criar Lista, Adicionar Elemento, try, catch, FileWriter e Escrever Arquivo.',
      'A ordem costuma ser: criar a lista → adicionar nomes → abrir o try → escrever no arquivo dentro do try → catch para tratar o erro.'
    ]
  },
  {
    id: 'relatorio-notas',
    titulo: 'Relatório de Notas',
    descricao:
      'O professor guardou as notas dos alunos em um arquivo chamado notas.txt. ' +
      'Monte um programa que leia esse arquivo com BufferedReader (protegido por ' +
      'try e catch, porque o arquivo pode não existir), guarde cada aluno e sua nota ' +
      'em um HashMap e, no final, mostre o mapa completo na tela com ' +
      'System.out.println().',
    objetivoPedagogico:
      'Integrar leitura de Arquivos, Tratamento de Exceções e Collections (HashMap).',
    blocosPermitidos: [
      'var_string', 'print', 'filereader', 'bufferedreader', 'ler_linha',
      'try', 'catch', 'finally', 'hashmap_criar', 'hashmap_add', 'hashmap_buscar',
      'hashmap_mostrar', 'fechar_arquivo', 'arraylist_criar'
    ],
    regras: {
      obrigatorios: ['try', 'catch', 'bufferedreader', 'ler_linha', 'hashmap_criar', 'hashmap_add', 'hashmap_mostrar'],
      proibidos: [],
      ordem: [
        ['try', 'catch'],
        ['bufferedreader', 'ler_linha'],
        ['hashmap_criar', 'hashmap_add'],
        ['hashmap_add', 'hashmap_mostrar']
      ],
      quantidadeMinima: 6
    },
    dicas: [
      'Você precisa ler de um arquivo, guardar pares nome→nota e mostrar tudo no final.',
      'Blocos prováveis: try, catch, BufferedReader, Ler Linha, Criar Mapa, Adicionar Chave/Valor e Mostrar Mapa.',
      'Ordem comum: criar o mapa → abrir try → BufferedReader → Ler Linha → adicionar no mapa → catch → mostrar o mapa.'
    ]
  }
];

export function getChallenge(id) {
  return CHALLENGES.find((c) => c.id === id);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- challenges`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(data): dois desafios integradores"
```

---

## Task 5: Validador pedagógico (`engine/validator.js`)

**Files:**
- Create: `src/engine/validator.js`
- Test: `src/engine/__tests__/validator.test.js`

**Interfaces:**
- Consumes: instâncias (achatadas via helper interno), `challenge.regras`, `getBlock`.
- Produces: `validate(instances, challenge) -> { ok: boolean, mensagem: string }`. `flatten(instances) -> string[]` (blockIds em ordem de execução, incluindo filhos) — exportado para testes.

- [ ] **Step 1: Escrever o teste**

`src/engine/__tests__/validator.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { validate, flatten } from '../validator.js';

const inst = (blockId, children = []) => ({ instanceId: blockId, blockId, fields: {}, children });

const challenge = {
  regras: {
    obrigatorios: ['arraylist_criar', 'arraylist_add', 'try', 'catch'],
    proibidos: ['while'],
    ordem: [['arraylist_criar', 'arraylist_add'], ['try', 'catch']],
    quantidadeMinima: 4
  }
};

describe('flatten', () => {
  it('inclui filhos de containers em ordem', () => {
    const seq = flatten([inst('try', [inst('arraylist_add')]), inst('catch')]);
    expect(seq).toEqual(['try', 'arraylist_add', 'catch']);
  });
});

describe('validate', () => {
  it('reclama de bloco obrigatório faltando, de forma pedagógica', () => {
    const r = validate([inst('arraylist_criar')], challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem).not.toBe('Resposta incorreta.');
    expect(r.mensagem.length).toBeGreaterThan(20);
  });

  it('reclama de bloco proibido', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try', [inst('while')]), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('while');
  });

  it('reclama de ordem errada explicando o que fazer', () => {
    const seq = [inst('arraylist_add'), inst('arraylist_criar'), inst('try'), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('antes');
  });

  it('aprova solução correta', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try'), inst('catch')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(true);
  });

  it('exige catch depois de try (mensagem específica)', () => {
    const seq = [inst('arraylist_criar'), inst('arraylist_add'), inst('try')];
    const r = validate(seq, challenge);
    expect(r.ok).toBe(false);
    expect(r.mensagem.toLowerCase()).toContain('catch');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- validator`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/engine/validator.js`**

```js
import { getBlock } from '../data/blocks.js';

export function flatten(instances) {
  const out = [];
  for (const node of instances || []) {
    out.push(node.blockId);
    if (node.children && node.children.length) out.push(...flatten(node.children));
  }
  return out;
}

function rotulo(id) {
  const b = getBlock(id);
  return b ? b.label : id;
}

export function validate(instances, challenge) {
  const { obrigatorios = [], proibidos = [], ordem = [], quantidadeMinima = 0 } = challenge.regras || {};
  const seq = flatten(instances);

  // 1. Blocos proibidos
  for (const id of proibidos) {
    if (seq.includes(id)) {
      return { ok: false, mensagem:
        `O bloco "${rotulo(id)}" não deve ser usado neste desafio. Tente resolver de outra forma.` };
    }
  }

  // 2. Quantidade mínima
  if (seq.length < quantidadeMinima) {
    return { ok: false, mensagem:
      `Seu programa ainda está pequeno para resolver o problema. Faltam blocos para completar todas as etapas do desafio.` };
  }

  // 3. Blocos obrigatórios ausentes
  for (const id of obrigatorios) {
    if (!seq.includes(id)) {
      // mensagem especial para try/catch
      if (id === 'catch' && seq.includes('try')) {
        return { ok: false, mensagem:
          'O bloco try está no lugar certo. Lembre-se de que todo try precisa de pelo menos um catch para tratar o erro.' };
      }
      return { ok: false, mensagem:
        `Ainda falta usar o bloco "${rotulo(id)}". Ele é necessário para uma das etapas do desafio.` };
    }
  }

  // 4. Ordem (pares "A antes de B")
  for (const [a, b] of ordem) {
    const ia = seq.indexOf(a);
    const ib = seq.indexOf(b);
    if (ia === -1 || ib === -1) continue; // ausência já tratada acima
    if (ia > ib) {
      return { ok: false, mensagem:
        `Você está no caminho certo, mas a ordem precisa de ajuste: o bloco "${rotulo(a)}" deve vir antes de "${rotulo(b)}".` };
    }
  }

  return { ok: true, mensagem: 'Parabéns! Você concluiu este desafio.' };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- validator`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): validador com mensagens pedagógicas"
```

---

## Task 6: Pontuação e ranking (`gamification/`)

**Files:**
- Create: `src/gamification/scoring.js`, `src/gamification/ranking.js`
- Test: `src/gamification/__tests__/scoring.test.js`, `src/gamification/__tests__/ranking.test.js`

**Interfaces:**
- Produces:
  - `computeXP({ hintsUsed, wrongAttempts, forbiddenUsed, firstTry }) -> number` (base 100).
  - `HINT_PENALTY`, `WRONG_PENALTY`, `FORBIDDEN_PENALTY`, `FIRST_TRY_BONUS`, `NO_HINT_BONUS` (constantes exportadas).
  - `sortRanking(grupos) -> grupos` ordenados por `xp` desc; `addXP(grupos, nomeGrupo, xp) -> novoArray`.

- [ ] **Step 1: Escrever os testes**

`src/gamification/__tests__/scoring.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { computeXP, HINT_PENALTY, FIRST_TRY_BONUS } from '../scoring.js';

describe('computeXP', () => {
  it('acerto perfeito na primeira dá base + bônus', () => {
    expect(computeXP({ hintsUsed: 0, wrongAttempts: 0, forbiddenUsed: 0, firstTry: true }))
      .toBe(100 + FIRST_TRY_BONUS + 20); // NO_HINT_BONUS = 20
  });
  it('cada dica reduz a pontuação', () => {
    const semDica = computeXP({ hintsUsed: 0, wrongAttempts: 0, forbiddenUsed: 0, firstTry: false });
    const comDica = computeXP({ hintsUsed: 1, wrongAttempts: 0, forbiddenUsed: 0, firstTry: false });
    expect(semDica - comDica).toBe(HINT_PENALTY);
  });
  it('nunca fica negativo', () => {
    expect(computeXP({ hintsUsed: 99, wrongAttempts: 99, forbiddenUsed: 99, firstTry: false }))
      .toBeGreaterThanOrEqual(0);
  });
});
```

`src/gamification/__tests__/ranking.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { sortRanking, addXP } from '../ranking.js';

describe('ranking', () => {
  it('ordena por xp desc', () => {
    const r = sortRanking([{ nome: 'A', xp: 10 }, { nome: 'B', xp: 30 }, { nome: 'C', xp: 20 }]);
    expect(r.map((g) => g.nome)).toEqual(['B', 'C', 'A']);
  });
  it('addXP soma sem mutar o original', () => {
    const orig = [{ nome: 'A', xp: 10 }];
    const novo = addXP(orig, 'A', 5);
    expect(novo[0].xp).toBe(15);
    expect(orig[0].xp).toBe(10);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- scoring ranking`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/gamification/scoring.js`:
```js
export const BASE_XP = 100;
export const HINT_PENALTY = 15;
export const WRONG_PENALTY = 10;
export const FORBIDDEN_PENALTY = 20;
export const FIRST_TRY_BONUS = 30;
export const NO_HINT_BONUS = 20;

export function computeXP({ hintsUsed = 0, wrongAttempts = 0, forbiddenUsed = 0, firstTry = false }) {
  let xp = BASE_XP;
  xp -= hintsUsed * HINT_PENALTY;
  xp -= wrongAttempts * WRONG_PENALTY;
  xp -= forbiddenUsed * FORBIDDEN_PENALTY;
  if (firstTry && wrongAttempts === 0) xp += FIRST_TRY_BONUS;
  if (hintsUsed === 0) xp += NO_HINT_BONUS;
  return Math.max(0, xp);
}
```

`src/gamification/ranking.js`:
```js
export function sortRanking(grupos) {
  return [...grupos].sort((a, b) => b.xp - a.xp);
}

export function addXP(grupos, nome, xp) {
  return grupos.map((g) => (g.nome === nome ? { ...g, xp: g.xp + xp } : g));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- scoring ranking`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(gamification): pontuação e ranking"
```

---

## Task 7: Primitivos de UI + tema (`components/ui/`)

**Files:**
- Create: `src/components/ui/Button.jsx`, `src/components/ui/Card.jsx`, `src/components/ui/Badge.jsx`, `src/components/ui/Modal.jsx`
- Modify: `src/App.jsx` (render de demonstração temporário)

**Interfaces:**
- Produces: `<Button variant="primary|ghost|success" onClick>`, `<Card>`, `<Badge color>`, `<Modal open onClose title>`.

- [ ] **Step 1: Implementar os primitivos**

`src/components/ui/Button.jsx`:
```jsx
const styles = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  ghost: 'bg-transparent border border-base-border hover:bg-base-panel text-slate-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white'
};
export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
```

`src/components/ui/Card.jsx`:
```jsx
export default function Card({ className = '', ...props }) {
  return <div className={`bg-base-panel border border-base-border rounded-xl ${className}`} {...props} />;
}
```

`src/components/ui/Badge.jsx`:
```jsx
export default function Badge({ color = '#4f8cff', children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color + '22', color }}>
      {children}
    </span>
  );
}
```

`src/components/ui/Modal.jsx`:
```jsx
import { AnimatePresence, motion } from 'framer-motion';
export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="bg-base-panel border border-base-border rounded-2xl max-w-md w-full p-6"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}>
            {title && <h2 className="text-xl font-bold mb-3">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Demonstração rápida em App.jsx e checar visual**

Substituir `App.jsx` por um render que mostra os 4 primitivos. Run: `npm run dev`, abrir no navegador e confirmar que aparecem estilizados no tema escuro.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(ui): primitivos Button, Card, Badge, Modal"
```

---

## Task 8: Estado do workspace + hook de progresso (`context/`, `hooks/`)

**Files:**
- Create: `src/context/ChallengeContext.jsx`, `src/hooks/useLocalStorage.js`, `src/utils/id.js`
- Test: `src/hooks/__tests__/useLocalStorage.test.js`

**Interfaces:**
- Consumes: nada externo.
- Produces:
  - `newId() -> string` (util para instanceId).
  - `useLocalStorage(key, initial) -> [value, setValue]`.
  - `ChallengeProvider` + `useChallenge()` expondo: `instances`, `addBlock(blockId)`, `removeInstance(id)`, `moveInstances(newArray)`, `updateField(id, name, value)`, `reset()`, `challenge`, `goNext()`, `hintsUsed`, `useHint()`, `wrongAttempts`, `registerWrong()`.

- [ ] **Step 1: Teste do useLocalStorage (com jsdom)**

Adicionar em `vitest.config.js` um segundo projeto OU trocar `environment` do teste via comentário. Para simplicidade, criar `src/hooks/__tests__/useLocalStorage.test.js` com header:
```js
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage.js';

describe('useLocalStorage', () => {
  it('persiste valor', () => {
    const { result } = renderHook(() => useLocalStorage('k', 1));
    act(() => result.current[1](5));
    expect(JSON.parse(localStorage.getItem('k'))).toBe(5);
  });
});
```
Adicionar devDeps: `jsdom`, `@testing-library/react`. Atualizar `package.json` e `npm install`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- useLocalStorage`
Expected: FAIL.

- [ ] **Step 3: Implementar util, hook e context**

`src/utils/id.js`:
```js
export function newId() {
  return 'b_' + Math.random().toString(36).slice(2, 10);
}
```

`src/hooks/useLocalStorage.js`:
```js
import { useState, useEffect } from 'react';
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue];
}
```

`src/context/ChallengeContext.jsx`: Provider com `useState` para `instances`, `hintsUsed`, `wrongAttempts`, índice do desafio atual. Implementar todas as funções da interface. `addBlock(blockId)` cria instância com `fields` preenchidos com defaults da definição; `updateField` faz update imutável (busca recursiva em children); `moveInstances` substitui o array top-level; `reset` limpa `instances` e contadores; `goNext` avança o índice. Progresso de desafios concluídos via `useLocalStorage('javablocks_progress', {})`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- useLocalStorage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): context do desafio + useLocalStorage"
```

---

## Task 9: Coluna esquerda — Biblioteca de Blocos (`aluno/BlockLibrary.jsx`)

**Files:**
- Create: `src/aluno/BlockLibrary.jsx`, `src/aluno/BlockChip.jsx`

**Interfaces:**
- Consumes: `BLOCKS`, `CATEGORIES` de `data/blocks.js`; `challenge.blocosPermitidos`; `addBlock` do context.
- Produces: componente que lista blocos permitidos agrupados por categoria; clicar/arrastar um chip adiciona ao workspace.

- [ ] **Step 1: Implementar BlockChip e BlockLibrary**

`BlockChip.jsx`: chip colorido com a cor da categoria e o `label`; usa `useDraggable` do @dnd-kit com id `lib:<blockId>`. Também aceita `onClick` para adicionar por clique (acessibilidade).

`BlockLibrary.jsx`: filtra `BLOCKS` por `challenge.blocosPermitidos`, agrupa por `CATEGORIES`, renderiza título da categoria + chips. Barra de rolagem própria; largura fixa (`w-64`).

- [ ] **Step 2: Verificação visual**

Integrar temporariamente no App dentro do Provider e confirmar que categorias e chips aparecem coloridos. Run: `npm run dev`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(aluno): biblioteca de blocos com categorias"
```

---

## Task 10: Coluna central — Workspace drag-and-drop (`aluno/Workspace.jsx`)

**Files:**
- Create: `src/aluno/Workspace.jsx`, `src/aluno/WorkspaceBlock.jsx`
- Modify: `src/aluno/ChallengeScreen.jsx` (criado na Task 12; se ainda não existir, integrar via App temporário)

**Interfaces:**
- Consumes: `instances`, `removeInstance`, `updateField`, `moveInstances` do context; `getBlock`.
- Produces: área que renderiza `instances` como blocos empilhados, reordenáveis via `@dnd-kit/sortable`; cada bloco mostra campos editáveis; container mostra área de filhos com placeholder "Solte blocos aqui".

- [ ] **Step 1: Implementar WorkspaceBlock**

Renderiza um bloco: barra colorida (cor da categoria), `label`, inputs para cada `field` (chamando `updateField(instanceId, name, value)` no `onChange`), botão remover (×). Se `container`, renderiza recursivamente `node.children` numa área recuada; se vazia, placeholder tracejado.

- [ ] **Step 2: Implementar Workspace**

Usa `DndContext` + `SortableContext` (estratégia vertical) sobre `instances` top-level. `onDragEnd`: se veio da biblioteca (`active.id` começa com `lib:`), chama `addBlock`; se reordenação, calcula nova ordem com `arrayMove` e chama `moveInstances`. Placeholder central "Arraste blocos aqui para montar seu programa" quando vazio.

- [ ] **Step 3: Verificação visual**

`npm run dev`: arrastar blocos da biblioteca para o centro, reordenar, editar campos, remover. Confirmar que funciona.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(aluno): workspace com drag-and-drop e edição de campos"
```

---

## Task 11: Coluna direita — Painel de código + sincronização (`aluno/CodePanel.jsx`)

**Files:**
- Create: `src/aluno/CodePanel.jsx`

**Interfaces:**
- Consumes: `instances` do context; `generateJava`.
- Produces: painel que mostra `generateJava(instances).lines`, uma `<div>` por linha com `data-instance-id`. Prop `highlightedId` destaca linhas; `onLineClick(instanceId)` emite clique. Botões controlados pelo pai (Mostrar/Ocultar).

- [ ] **Step 1: Implementar CodePanel**

Recebe `instances`, `highlightedId`, `onHoverLine`, `onLineClick`. Chama `generateJava` (via `useMemo`). Renderiza `<pre>` com linhas numeradas; linha recebe classe de destaque se `line.instanceId === highlightedId`. Linhas com `// Falta completar aqui` recebem cor de aviso (amber). `onMouseEnter`/`onClick` disparam callbacks com `line.instanceId`.

- [ ] **Step 2: Fiação de highlight no ChallengeScreen**

Estado `highlightedId` no nível da tela: hover num WorkspaceBlock seta o id; hover numa linha seta o id; ambos destacam o correspondente no outro lado. (Passar `onHover` para Workspace e CodePanel.)

- [ ] **Step 3: Verificação visual**

`npm run dev`: montar blocos, ver código atualizar ao vivo; passar mouse num bloco destaca linha e vice-versa; container vazio mostra "// Falta completar aqui" em amber.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(aluno): painel de código ao vivo com sincronização bloco↔código"
```

---

## Task 12: Tela do desafio + barra de ações (`aluno/ChallengeScreen.jsx`)

**Files:**
- Create: `src/aluno/ChallengeScreen.jsx`, `src/aluno/ChallengeHeader.jsx`, `src/aluno/ActionBar.jsx`
- Modify: `src/App.jsx` (renderiza `ChallengeProvider` + `ChallengeScreen`)

**Interfaces:**
- Consumes: tudo do `useChallenge()`; `validate`; `computeXP`.
- Produces: layout 3 colunas responsivo unindo BlockLibrary + Workspace + CodePanel; header com título/descrição/objetivo; ActionBar com os 5 botões.

- [ ] **Step 1: ChallengeHeader**

Mostra `challenge.titulo`, `challenge.descricao`, `Badge` do objetivo pedagógico.

- [ ] **Step 2: ActionBar**

Botões: **Mostrar/Ocultar Código** (toggle de estado local `showCode`), **Resetar Desafio** (`reset()`), **Verificar Resposta** (chama `validate(instances, challenge)`; se `ok` → dispara callback `onSuccess`; senão → `registerWrong()` + mostra `mensagem`), **Próximo Desafio** (`goNext()`, habilitado só após concluir), e botão **Dica** (Task 13).

- [ ] **Step 3: ChallengeScreen (layout 3 colunas)**

Grid responsivo: `lg:grid-cols-[16rem_1fr_1fr]`. Em telas pequenas, abas (Biblioteca / Montagem / Código). Integra header + colunas + ActionBar. Mantém `highlightedId` e `showCode`. Mostra a `mensagem` de validação numa faixa (verde se ok, amber se erro).

- [ ] **Step 4: App.jsx final**

```jsx
import { ChallengeProvider } from './context/ChallengeContext.jsx';
import ChallengeScreen from './aluno/ChallengeScreen.jsx';
export default function App() {
  return (
    <ChallengeProvider>
      <ChallengeScreen />
    </ChallengeProvider>
  );
}
```

- [ ] **Step 5: Verificação visual completa**

`npm run dev`: resolver o Desafio 1 de ponta a ponta; Verificar com solução incompleta mostra mensagem pedagógica; solução correta libera "Próximo Desafio"; Resetar limpa tudo; Mostrar/Ocultar código funciona.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(aluno): tela do desafio, layout 3 colunas e barra de ações"
```

---

## Task 13: Dicas progressivas (`aluno/HintButton.jsx`)

**Files:**
- Create: `src/aluno/HintButton.jsx`
- Modify: `src/aluno/ActionBar.jsx` (incluir o botão)

**Interfaces:**
- Consumes: `challenge.dicas`, `hintsUsed`, `useHint()` do context; `HINT_PENALTY`.
- Produces: botão que, ao clicar, avisa a penalidade e revela a próxima dica; respeita cooldown mínimo entre dicas.

- [ ] **Step 1: Implementar HintButton**

Estado local `lastHintAt`. Ao clicar: se `hintsUsed >= challenge.dicas.length`, desabilita. Antes de revelar, mostra Modal de confirmação: *"Pedir uma dica custa {HINT_PENALTY} XP. Deseja continuar?"*. Ao confirmar, `useHint()` (incrementa contador) e mostra a dica `dicas[hintsUsed]` num Modal. Cooldown: se `Date.now() - lastHintAt < 15000`, desabilita o botão e mostra "Aguarde alguns segundos para a próxima dica."

- [ ] **Step 2: Verificação visual**

`npm run dev`: pedir dica mostra aviso de penalidade → revela dica 1; segunda dica exige esperar o cooldown; após 3 dicas o botão desabilita.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(aluno): dicas progressivas com penalidade e cooldown"
```

---

## Task 14: Animação de sucesso + concessão de XP (`aluno/SuccessOverlay.jsx`)

**Files:**
- Create: `src/aluno/SuccessOverlay.jsx`
- Modify: `src/aluno/ChallengeScreen.jsx` (mostrar overlay no sucesso; conceder XP)

**Interfaces:**
- Consumes: `computeXP`; contadores do context; ranking (Task 15).
- Produces: overlay animado "Parabéns! Você concluiu este desafio." mostrando XP ganho; botão "Próximo Desafio".

- [ ] **Step 1: Implementar SuccessOverlay**

Modal/overlay Framer Motion com check animado, mensagem e `xpGanho`. Calcula `computeXP({ hintsUsed, wrongAttempts, forbiddenUsed: 0, firstTry: wrongAttempts === 0 })`.

- [ ] **Step 2: Fiação no ChallengeScreen**

`onSuccess`: marca desafio como concluído no progresso, calcula XP, credita ao grupo ativo no ranking (Task 15), abre overlay. Botão do overlay chama `goNext()`.

- [ ] **Step 3: Verificação visual**

`npm run dev`: concluir desafio mostra animação + XP; "Próximo Desafio" leva ao Desafio 2.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(aluno): overlay de sucesso e concessão de XP"
```

---

## Task 15: Ranking da sala + notificações (`aluno/RankingPanel.jsx`, `aluno/Toast.jsx`)

**Files:**
- Create: `src/aluno/RankingPanel.jsx`, `src/aluno/Toast.jsx`
- Create: `src/data/groups.js` (grupos-semente)
- Modify: `src/context/ChallengeContext.jsx` (estado de ranking em localStorage + grupo ativo)

**Interfaces:**
- Consumes: `sortRanking`, `addXP`; `groups.js`.
- Produces: painel de ranking com pódio (🥇🥈🥉) atualizado ao vivo; `Toast` de notificações ("Grupo X concluiu o desafio", "Y assumiu a liderança").

- [ ] **Step 1: Grupos-semente**

`src/data/groups.js`:
```js
export const SEED_GROUPS = [
  { nome: 'ByteMasters', xp: 0 },
  { nome: 'Java Warriors', xp: 0 },
  { nome: 'NullPointer', xp: 0 },
  { nome: 'Compiladores', xp: 0 }
];
export const GRUPO_ATIVO = 'ByteMasters';
```

- [ ] **Step 2: Estado de ranking no context**

`useLocalStorage('javablocks_ranking', SEED_GROUPS)`. Expor `grupos`, `grupoAtivo`, e `creditarXP(xp)` que aplica `addXP(grupos, grupoAtivo, xp)`, detecta mudança de líder e empurra uma notificação (fila de toasts).

- [ ] **Step 3: RankingPanel + Toast**

`RankingPanel`: lista `sortRanking(grupos)` com medalhas nos 3 primeiros, destacando o grupo ativo. Animação de reordenação com `layout` do Framer Motion. `Toast`: renderiza a fila de notificações com auto-dismiss (3s) e animação de entrada/saída.

- [ ] **Step 4: Verificação visual**

`npm run dev`: concluir um desafio credita XP ao ByteMasters, o pódio reordena com animação e aparece um toast de conclusão / liderança.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(gamification): ranking ao vivo com pódio e notificações"
```

---

## Task 16: Polimento final, responsividade e README

**Files:**
- Modify: componentes de `aluno/` (ajustes de espaçamento, animações de entrada)
- Create: `README.md`

**Interfaces:**
- Produces: app coeso e responsivo; README com instalação, estrutura, e nota sobre a fase futura (professor/Firebase/Render).

- [ ] **Step 1: Passada de responsividade**

Testar em larguras mobile/tablet/desktop (usar as ferramentas de preview ou DevTools). Garantir que as 3 colunas viram abas no mobile e nada estoura. Ajustar `overflow`, alturas e `sticky` da ActionBar.

- [ ] **Step 2: Animações de entrada**

Adicionar `motion` de fade/slide sutil na entrada de header, colunas e chips (stagger leve). Sem exageros.

- [ ] **Step 3: README**

Escrever `README.md` com: descrição, stack, `npm install` / `npm run dev` / `npm test` / `npm run build`, estrutura de pastas, como adicionar um novo desafio (editar `data/challenges.js`), e a seção "Fase futura: Painel do Professor + Firebase + deploy na Render".

- [ ] **Step 4: Rodar toda a suíte de testes**

Run: `npm test`
Expected: todos os testes das Tasks 1–8 PASS.

- [ ] **Step 5: Verificação final completa**

`npm run dev`: percorrer os 2 desafios do início ao fim, incluindo dicas, erros, sucesso, XP e ranking. Confirmar tema escuro coeso e responsividade.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: polimento, responsividade e README"
```

---

## Self-Review (cobertura do spec)

- Layout 3 colunas → Tasks 9, 10, 11, 12 ✅
- Biblioteca por categorias → Task 9 ✅
- Drag-and-drop → Task 10 ✅
- Código Java ao vivo → Tasks 3, 11 ✅
- Marcador "// Falta completar aqui" → Task 3 ✅
- Sincronização bloco↔código (hover/click) → Task 11 ✅
- 5 botões (Mostrar/Ocultar/Resetar/Verificar/Próximo) → Task 12 ✅
- Todos os blocos do spec → Task 2 ✅
- 2 desafios integradores com objetivo pedagógico → Task 4 ✅
- Validação (ordem, obrigatórios, proibidos, quantidade) com mensagens pedagógicas → Task 5 ✅
- Dicas progressivas com penalidade e cooldown → Task 13 ✅
- Animação de sucesso + mensagem "Parabéns!" → Task 14 ✅
- XP base 100, penalidades e bônus → Task 6, 14 ✅
- Ranking ao vivo com pódio e notificações → Task 15 ✅
- Tema escuro, blocos coloridos, animações, responsivo → Tasks 7, 16 ✅
- Estrutura escalável + separação → toda a estrutura de pastas ✅
- Fase futura (professor/Firebase/Render) documentada → Task 16 (README) + spec ✅
