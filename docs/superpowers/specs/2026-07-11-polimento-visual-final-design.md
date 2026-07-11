# JavaBlocks — Polimento Visual Final (Design)

**Data:** 2026-07-11
**Escopo:** Passada de design mais profunda, coesa entre o app do aluno e o painel do professor. Puramente visual/presentational — nenhuma mudança de lógica, dados, navegação ou comportamento funcional.

Depende de: app do aluno (`2026-07-05-javablocks-aluno-design.md`) e painel do professor (`2026-07-10-painel-professor-integrado-design.md`), ambos já implementados e mesclados no `main`.

---

## 1. Objetivo

Elevar a qualidade visual do produto para apresentação, dando-lhe uma identidade mais distintiva e coesa entre as duas experiências (aluno e professor), sem alterar estrutura, fluxo ou lógica de nenhuma tela.

## 2. Decisões

- **Paleta:** mantém a base atual (`base-bg #0f1117`, `base-panel #171a23`, `base-border #262a36`, `accent #4f8cff` no aluno, `adminAccent #8b5cf6` no professor), aprofundada com sombras mais ricas (levemente tingidas de cor, não preto puro) e gradientes radiais sutis em pontos-chave.
- **Tema:** "blocos de programação" — um motivo gráfico sutil inspirado em peças/conectores de blocos, aplicado **pontualmente** (não difuso por todo o app), reforçando a identidade sem competir com as áreas de trabalho.
- **Tipografia:** introduz `JetBrains Mono` (Google Fonts) como novo `font-mono`, aplicada em títulos de tela, números de XP/estatísticas e rótulos de blocos. Texto corrido (descrições, formulários) permanece na fonte padrão do sistema, por legibilidade.
- **Escopo funcional:** zero mudanças de lógica/dados/navegação/testes existentes. Verificação é só por inspeção visual (desktop + mobile), já que não há comportamento novo a testar com testes automatizados.

## 3. Onde o motivo de blocos aparece (pontual)

| Componente | Tratamento |
|---|---|
| `ChallengeHeader.jsx` (aluno) | Padrão de fundo sutil (`BlockPattern`) + título em `font-mono` |
| `ProfessorLogin.jsx` | Padrão de fundo + brilho radial em `adminAccent` + título "Área do Professor" em `font-mono` |
| `SuccessOverlay.jsx` | Padrão de fundo no cartão de celebração + XP ganho em destaque, grande, `font-mono` |
| `Workspace.jsx` (estado vazio) | Ilustração SVG de blocos desconectados via `EmptyState`, substitui o texto solto atual |
| `ProfessorChallengesPage.jsx` (estado vazio) | Mesma ilustração via `EmptyState`, texto "Nenhum desafio cadastrado ainda." |
| `ProfessorLayout.jsx` | Cabeçalho da sidebar ("JavaBlocks / Painel do Professor") com tipografia mono + leve gradiente de fundo |
| `RankingPanel.jsx` (aluno) | Números de XP no pódio em `font-mono` |

**Fora do escopo do motivo:** as 3 colunas do editor (biblioteca/workspace/código) e a tabela de desafios do professor permanecem limpas, sem padrão de fundo — são áreas de trabalho e não devem competir visualmente com o conteúdo.

## 4. Micro-interações e polimento geral

- **Botões/chips:** hover com leve `scale` (1.02) + sombra crescente nos CTAs primários (`Button` variantes `primary`/`success`); anéis de foco mais visíveis (acessibilidade).
- **Cartões:** sombra em repouso mais suave; cresce sutilmente no hover onde o cartão é clicável.
- **Transições de aba no painel do professor:** animação de entrada (fade/slide, Framer Motion) ao trocar Desafios/Dashboard/Configurações, consistente com o padrão de entrada já usado no app do aluno.
- **Scrollbars customizadas** (tema escuro) via `index.css`, substituindo o padrão do navegador.
- **Favicon:** adicionar `public/favicon.svg` (hoje inexistente).

## 5. Novos componentes reutilizáveis

- `src/components/ui/BlockPattern.jsx` — SVG decorativo (padrão de conectores/blocos), baixa opacidade, `pointer-events-none`, reutilizado nos 3 pontos-chave da seção 3.
- `src/components/ui/EmptyState.jsx` — ilustração SVG pequena + texto, usado em `Workspace.jsx` e `ProfessorChallengesPage.jsx`.

## 6. Arquivos afetados

```
tailwind.config.js                         # font-mono (JetBrains Mono)
index.html                                 # <link> da fonte + favicon
src/index.css                              # scrollbar customizada
src/components/ui/
  BlockPattern.jsx                         # novo
  EmptyState.jsx                           # novo
  Button.jsx                               # hover/foco
  Card.jsx                                 # sombra
src/aluno/ChallengeHeader.jsx              # padrão de fundo + mono
src/aluno/RankingPanel.jsx                 # XP em mono
src/aluno/SuccessOverlay.jsx               # padrão de fundo + XP em mono
src/aluno/Workspace.jsx                    # usa EmptyState
src/professor/ProfessorLogin.jsx           # padrão de fundo + mono
src/professor/ProfessorLayout.jsx          # cabeçalho da sidebar + mono
src/professor/ProfessorChallengesPage.jsx  # usa EmptyState
public/favicon.svg                         # novo
```

## 7. Verificação

- `npm test` — zero regressão (nenhum teste deve quebrar; nenhum teste novo é necessário, já que não há lógica nova).
- `npm run build` — limpo.
- Inspeção visual no navegador (desktop e mobile) em cada uma das 7 telas/componentes da seção 3, tema escuro (único tema do produto).

## 8. Fora de escopo

- Mudança de paleta de cores (mantém a base atual).
- Motivo de blocos difuso em todas as telas (só nos pontos-chave listados).
- Qualquer alteração de lógica, dados, navegação, testes existentes ou comportamento funcional.
- Tema claro (o produto é exclusivamente escuro).

## 9. Plano de implementação (fases)

1. **Fundação:** fonte `JetBrains Mono` + `font-mono` no Tailwind, favicon, scrollbar customizada.
2. **Componentes reutilizáveis:** `BlockPattern.jsx`, `EmptyState.jsx`.
3. **App do aluno:** `ChallengeHeader.jsx`, `RankingPanel.jsx`, `SuccessOverlay.jsx`, `Workspace.jsx` (estado vazio).
4. **Painel do professor:** `ProfessorLogin.jsx`, `ProfessorLayout.jsx`, `ProfessorChallengesPage.jsx` (estado vazio), transições de aba.
5. **Polimento geral:** hover/foco em `Button.jsx`/`Card.jsx`, verificação visual completa (desktop + mobile) em todas as telas tocadas.
