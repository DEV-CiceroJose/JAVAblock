# JavaBlocks — App do Aluno

JavaBlocks é uma plataforma visual de aprendizagem de Java baseada em blocos, criada para
estudantes do ensino médio. O aluno monta um programa arrastando blocos (variáveis, entrada/saída,
condições, repetições, exceções, coleções e arquivos) em uma área de montagem, e o código Java
correspondente é **gerado ao vivo**, linha a linha, com sincronização visual entre cada bloco e a
linha de código que ele produz.

A proposta pedagógica é reforçar conceitos de Java através de desafios integradores (que combinam
vários tópicos, como Coleções + Exceções + Arquivos), validação com mensagens explicativas (não
apenas "certo/errado"), sistema de dicas progressivas com penalidade, e gamificação com XP e
ranking da turma — tudo para tornar o aprendizado mais concreto e motivador.

## Stack

- **React 18** — biblioteca de UI
- **Vite** — build tool e dev server
- **Tailwind CSS** — estilização utilitária (tema escuro)
- **Framer Motion** — animações de entrada, transições e feedback
- **@dnd-kit** (core + sortable + utilities) — drag-and-drop dos blocos
- **Vitest** + **@testing-library/react** — testes unitários
- Persistência local via **localStorage** (progresso do aluno e ranking da turma); não há backend
  nesta versão.

## Como rodar

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento (http://localhost:5173)
npm run dev

# rodar a suíte de testes (Vitest)
npm test

# gerar build de produção em dist/
npm run build
```

Outros scripts úteis: `npm run preview` (serve o build de produção localmente) e
`npm run test:watch` (Vitest em modo watch).

## Estrutura de pastas

```
src/
  aluno/            Telas e componentes da experiência do aluno (tela do desafio, biblioteca de
                     blocos, área de montagem, painel de código, barra de ações, dicas, overlay
                     de sucesso, ranking, toasts).
  data/             Dados estáticos do domínio: catálogo de blocos (blocks.js), categorias de
                     blocos (groups.js) e os desafios integradores (challenges.js).
  engine/           Lógica pura e testável do "motor" do app: geração de código Java a partir dos
                     blocos montados (codeGenerator.js) e validação da solução do aluno contra as
                     regras do desafio (validator.js).
  gamification/     Regras de pontuação (scoring.js — cálculo de XP com penalidades/bônus) e
                     ranking (ranking.js — ordenação dos grupos/turma).
  components/ui/    Primitivos de UI reutilizáveis (Button, Badge, Card, Modal) usados em toda a
                     aplicação, independentes do domínio de blocos.
  context/          ChallengeContext.jsx — estado global do desafio ativo (blocos na área de
                     montagem, grupo ativo, XP, dicas usadas, tentativas erradas, ranking).
  hooks/            Hooks reutilizáveis, como useLocalStorage.js para persistir estado no
                     navegador.
  utils/            Utilitários pequenos e sem dependências de domínio (ex.: id.js para gerar ids
                     de instância de bloco).
```

Cada pasta de lógica (`data`, `engine`, `gamification`, `hooks`) tem sua própria pasta
`__tests__` com testes Vitest.

## Como adicionar um novo desafio

Os desafios ficam em `src/data/challenges.js`, no array `CHALLENGES`. Cada desafio segue este
formato:

```js
{
  id: 'meu-novo-desafio',              // identificador único (kebab-case)
  titulo: 'Título do desafio',
  descricao: 'Texto explicando o problema/contexto para o aluno.',
  objetivoPedagogico: 'Frase curta descrevendo os conceitos integrados (ex.: Coleções + Exceções).',

  // Quais blocos aparecem na Biblioteca para este desafio (ids definidos em data/blocks.js)
  blocosPermitidos: ['var_string', 'print', 'try', 'catch', /* ... */],

  regras: {
    // Blocos que OBRIGATORIAMENTE precisam estar na solução
    obrigatorios: ['try', 'catch'],

    // Blocos que NÃO podem ser usados (opcional, pode ficar como [])
    proibidos: [],

    // Pares [antes, depois] que expressam ordem relativa exigida entre blocos
    ordem: [
      ['try', 'catch']
    ],

    // Quantidade mínima de blocos que a solução deve ter
    quantidadeMinima: 4
  },

  // Exatamente 3 dicas, do mais genérico ao mais específico (usadas pelo sistema de dicas
  // progressivas, com penalidade de XP e cooldown entre uma dica e outra)
  dicas: [
    'Dica 1: mais geral, aponta a estratégia.',
    'Dica 2: cita os blocos prováveis.',
    'Dica 3: sugere a ordem de montagem.'
  ]
}
```

Depois de adicionar o objeto ao array, o desafio passa a fazer parte do fluxo normal (aparece após
o desafio anterior via botão "Próximo Desafio"). Se quiser validar a estrutura, veja os testes em
`src/data/__tests__/challenges.test.js` — eles conferem que todo desafio tem os campos esperados.

Se o novo desafio usar blocos que ainda não existem, adicione-os primeiro em `src/data/blocks.js`
(incluindo `category`, `label`, `fields` e `template` do bloco) e, se necessário, uma nova
categoria em `groups.js`.

## Backend (Fase 2)

O backend Express + Firestore está implementado em `backend/`. Ele fornece:

- **API REST** para listar desafios, submeter resultados, e gerenciar ranking
- **Autenticação de admin** para criação e edição de desafios sem código
- **Persistência** em Firestore (Firebase) ou modo em memória para testes locais
- **Seed script** para popular a base com desafios iniciais

O app do aluno busca desafios do backend (via `VITE_API_URL`) com fallback para dados locais se o
servidor estiver indisponível. Para detalhes de setup, endpoints, deploy e configuração do Firebase,
veja [`backend/README.md`](./backend/README.md).

**Quick Start do Backend:**
```bash
cd backend
npm install
npm run dev              # desenvolvimento com reload automático
# ou: npm start         # produção
# ou: npm run seed      # popular Firestore com desafios iniciais
```

Sem credenciais do Firebase, o backend roda em modo em memória (volátil, ideal para desenvolvimento).

## Fase futura (fora do escopo desta versão)

A estrutura de pastas e as constantes de domínio já foram organizadas pensando em uma evolução
futura do produto, que inclui:

- **Painel do Professor** — visão agregada do progresso de todos os grupos/turmas e relatórios de
  desempenho (UI para gerenciar desafios sem código).
- **Sincronização entre dispositivos** — múltiplas turmas, contas de aluno/professor,
  e sincronização de estado via Firestore.
- **Deploy completo** — frontend e backend em produção (Render, Vercel ou similar).

Nenhuma dessas funcionalidades está implementada nesta versão; o foco atual é a experiência do
aluno com backend opcional em Firestore.
