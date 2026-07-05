# JavaBlocks — App do Aluno (Design)

**Data:** 2026-07-05
**Escopo desta entrega:** Aplicação do aluno (rota "app único no navegador"). Painel do professor e backend real (Firebase/Express/Render) ficam como fase futura, documentados no fim.

---

## 1. Objetivo

Plataforma web para ensino de Java no Ensino Médio, inspirada no MIT App Inventor. O aluno monta programas Java arrastando blocos; o código Java válido é gerado ao vivo. Foco em **apresentação/trabalho acadêmico**: precisa parecer um produto completo, ter UX excelente e **funcionar sempre**, sem depender de rede.

Conteúdo desta versão: **2 desafios**, cada um **integrando todos os módulos** (Tratamento de Exceções + Java Collections Framework + Manipulação de Arquivos).

## 2. Decisões de arquitetura

- **App único React**, roda 100% no navegador. Sem servidor, sem Firebase nesta fase.
- **Dados locais:** definições de blocos e desafios em arquivos JS/JSON dentro de `src/data/`. Progresso, XP e ranking em `localStorage`.
- **Motivo:** apresentação não pode quebrar por Wi-Fi ou chave expirada. Abre com `npm run dev` (ou build estático) e funciona offline.
- **Linguagem:** JavaScript moderno (sem TypeScript nesta fase, para reduzir atrito; a estrutura permite migrar depois).

**Stack:** React + Vite + Tailwind CSS + Framer Motion + Dnd Kit.

## 3. Estrutura de pastas

```
src/
  aluno/              # telas e componentes específicos do aluno
    ChallengeScreen.jsx
    BlockLibrary.jsx
    Workspace.jsx
    CodePanel.jsx
    ...
  data/               # o "backend" local
    blocks.js         # catálogo de blocos por categoria
    challenges.js     # os 2 desafios
  engine/
    codeGenerator.js  # árvore de blocos -> string Java
    validator.js      # valida e devolve mensagens pedagógicas
  gamification/
    scoring.js        # XP, penalidades, bônus
    ranking.js        # ranking da sala + notificações
  components/ui/       # primitivos reutilizáveis (Button, Card, Badge, Modal...)
  hooks/
  context/
  utils/
  # professor/        # FUTURO
```

## 4. Interface do aluno

Layout de **três colunas** (responsivo — em telas pequenas vira abas):

- **Esquerda — Biblioteca de Blocos:** todas as categorias (Variáveis, Entrada, Saída, Condições, Repetições, Exceções, ArrayList, HashSet, HashMap, Arquivos), agrupadas e coloridas por categoria. Blocos são arrastáveis.
- **Centro — Área de montagem:** o aluno solta os blocos e os reordena (drag-and-drop com Dnd Kit). Blocos podem ter campos editáveis (ex.: nome da variável, texto a imprimir).
- **Direita — Código Java ao vivo:** atualiza a cada alteração. Trechos incompletos aparecem como `// Falta completar aqui`.

**Botões:** Mostrar Código, Ocultar Código, Resetar Desafio, Verificar Resposta, Próximo Desafio.

**Sincronização inteligente:** hover em um bloco destaca o trecho de código correspondente; clicar numa linha de código destaca o bloco. (Implementado via ids compartilhados entre bloco e linhas geradas.)

## 5. Catálogo de blocos (`data/blocks.js`)

Cada bloco tem: `id`, `category`, `label`, `color`, `fields` (campos editáveis), e um `template` usado pelo gerador de código. Categorias e blocos conforme o spec original (Variáveis, Entrada, Saída, Condições, Repetições, Exceções, ArrayList/HashSet/HashMap, Arquivos).

## 6. Motor de geração de código (`engine/codeGenerator.js`)

- Entrada: lista ordenada de blocos (com aninhamento para `try/catch`, `if/else`, `for/while`).
- Saída: string Java válida e indentada, envolvida em `public class Main { public static void main(String[] args) { ... } }`.
- Blocos-container vazios geram comentário `// Falta completar aqui`.
- Cada linha gerada carrega o `blockId` de origem (para a sincronização da coluna direita).

## 7. Motor de validação (`engine/validator.js`)

Cada desafio define regras: `blocosObrigatorios`, `blocosProibidos`, `ordemEsperada` (parcial/flexível), `quantidadeMinima`. O validador:

- Retorna `{ ok: true }` ou `{ ok: false, mensagem }`.
- **Mensagens são sempre pedagógicas**, nunca "Resposta incorreta". Ex.: *"Você criou o ArrayList corretamente. Agora falta adicionar os elementos antes de exibir a lista."* / *"Todo `try` precisa de pelo menos um `catch`."*
- Ordem é validada de forma tolerante (relações "X antes de Y"), não exigindo posição exata, para não punir soluções válidas equivalentes.

## 8. Desafios (`data/challenges.js`)

Dois desafios integradores. Cada um: `titulo`, `descricao` (linguagem simples, explica o problema — não diz só quais blocos usar), `objetivoPedagogico`, `blocosPermitidos`, regras de validação (seção 7) e **dicas progressivas** (1: conceito → 2: quais blocos → 3: ordem parcial).

**Desafio 1 — "Cadastro Seguro de Alunos":** ler nomes, guardar num `ArrayList`, tratar erro de entrada com `try/catch/finally`, e escrever a lista num arquivo com `FileWriter`/`BufferedWriter`.

**Desafio 2 — "Relatório de Notas":** ler linhas de um arquivo com `BufferedReader` dentro de `try/catch`, guardar notas num `HashMap` (nome→nota), e exibir o mapa com `System.out.println()`.

(Descrições completas em linguagem de aluno ficam no arquivo de dados.)

## 9. Sistema de dicas

- Até 3 dicas por desafio, progressivas. Cada dica pedida reduz a pontuação e o app avisa disso **antes** de revelar.
- Tempo mínimo de espera entre dicas (anti-abuso).
- Limites (máx. dicas, penalidade, tempo) ficam em constantes configuráveis — no futuro, editáveis pelo professor.

## 10. Gamificação (`gamification/`)

- Base: **100 XP** por desafio.
- **Penalidades:** usar dicas, tentativas incorretas, blocos proibidos.
- **Bônus:** sem dicas, sem erros, acerto na 1ª tentativa.
- **Ranking da sala:** grupos com XP acumulado, atualizado ao vivo, com pódio (🥇🥈🥉) e notificações ("Grupo X concluiu o desafio", "Y assumiu a liderança"). Grupos são simulados/locais nesta fase (seed em `data/` + progresso em `localStorage`).

## 11. Design visual

Tema escuro, inspirado no MIT App Inventor, blocos coloridos por categoria, animações suaves (Framer Motion), totalmente responsivo, visual profissional estilo Google Education.

## 12. Fora de escopo (fase futura)

- Painel do professor (CRUD de desafios, dashboard de estatísticas).
- Backend Express + Firebase Firestore, autenticação por token.
- Deploy separado na Render.
- A estrutura de pastas e as constantes já são desenhadas para acomodar isso sem reescrita.

## 13. Plano de implementação (fases)

1. **Fundação + Editor:** projeto rodando, layout 3 colunas, drag-and-drop, geração de Java ao vivo.
2. **Desafios + Validação:** Desafio 1, botão Verificar com mensagens pedagógicas, dicas, animação de sucesso.
3. **Segundo desafio + blocos restantes:** Desafio 2 e catálogo completo de blocos.
4. **Gamificação + Polimento:** XP, ranking, notificações, refino de tema/responsividade/animações.
