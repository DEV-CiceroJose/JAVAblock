# Backend — JavaBlocks (Fase 2)

Backend REST API para a plataforma JavaBlocks, desenvolvido em **Express.js** com suporte a **Firestore** (Firebase) e modo em memória para testes locais.

O backend fornece:
- **Endpoints públicos** para listar desafios, obter configurações, submeter resultados e consultar ranking
- **Endpoints administrativos** (autenticação por token) para gerenciar desafios, configurações e visualizar dashboard
- **Seed script** para popular a base de dados com desafios iniciais
- **Persistência opcional** via Firestore (Firebase) ou modo em memória (volátil)

## Requisitos

- **Node.js** 18+
- **npm** 9+
- (Opcional) Credenciais do Firebase (Project ID, Client Email, Private Key)

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Ambiente de desenvolvimento (com reload automático)
npm run dev

# Executar servidor em produção
npm start

# Rodar testes
npm test

# Popular base de dados com desafios iniciais
npm run seed
```

Após `npm start` ou `npm run dev`, o servidor estará disponível em `http://localhost:3000` (ou na porta definida por `PORT`).

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `backend/` com as seguintes variáveis:

| Variável | Tipo | Obrigatória? | Descrição | Exemplo |
|----------|------|--------------|-----------|---------|
| `PORT` | número | Não (padrão: 3000) | Porta em que o servidor escuta | `3000` |
| `CORS_ORIGINS` | string | Não (padrão: `http://localhost:5173`) | Origins permitidos para CORS (separados por vírgula) | `http://localhost:5173,https://javablocks.app` |
| `ADMIN_TOKEN` | string | Não (padrão: `admin-token-123`) | Token para autenticação em endpoints `/api/admin/*` | `seu-token-secreto-aqui` |
| `FIREBASE_PROJECT_ID` | string | Não | ID do projeto Firebase | `meu-projeto-123` |
| `FIREBASE_CLIENT_EMAIL` | string | Não | Email da conta de serviço do Firebase | `firebase-adminsdk-xyz@meu-projeto-123.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | string | Não | Chave privada da conta de serviço (em formato PEM) | `-----BEGIN PRIVATE KEY-----\nMII...` |

### Notas Importantes

- **Sem credenciais do Firebase**, o backend executa em **modo em memória** (volátil). Dados são perdidos quando o servidor reinicia — ideal para desenvolvimento local e testes automatizados.
- **Chave privada do Firebase**: ao copiar do JSON da conta de serviço, a quebra de linha literal (`\n`) na chave é importante. Se usar um arquivo `.env`, certifique-se de envolver a chave em aspas duplas:
  ```
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
  ```

## Configuração do Firebase (Passo a Passo)

Se desejar persistência em um banco de dados real, configure o Firestore no Firebase:

### 1. Criar um Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Criar projeto"** (ou selecione um existente)
3. Insira o nome do projeto (ex: `javablocks`)
4. Desabilite o Google Analytics (opcional)
5. Clique em **"Criar projeto"** e aguarde

### 2. Ativar Firestore

1. No painel do projeto, vá para **Firestore Database** (no menu esquerdo, seção Build)
2. Clique em **"Criar banco de dados"**
3. Escolha a região mais próxima (ex: `southamerica-east1` para Brasil)
4. Selecione **"Começar no modo de teste"** (permissões abertas para desenvolvimento)
5. Clique em **"Criar"** e aguarde a inicialização

### 3. Gerar Conta de Serviço

1. No Firebase Console, vá para **Configurações do Projeto** (engrenagem no canto superior)
2. Clique na aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Um arquivo JSON será baixado com as credenciais

### 4. Extrair as 3 Credenciais Principais

Abra o JSON baixado e copie os valores para `.env`:

```json
{
  "type": "service_account",
  "project_id": "meu-projeto-123",                    // FIREBASE_PROJECT_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",  // FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xyz@...",        // FIREBASE_CLIENT_EMAIL
  ...
}
```

**Exemplo de `.env`:**

```
PORT=3000
ADMIN_TOKEN=seu-token-secreto
CORS_ORIGINS=http://localhost:5173,https://seu-dominio.com

# Firebase
FIREBASE_PROJECT_ID=meu-projeto-123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@meu-projeto-123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 5. Rodar o Seed Script

Após configurar o Firebase, execute:

```bash
npm run seed
```

Isto populará o banco com os desafios iniciais. Você poderá verificar os dados no Firestore Console.

## Endpoints da API

### Públicos (sem autenticação)

Todos os endpoints públicos aceitam requisições CORS. Exemplos usando `curl`:

#### `GET /api/health`
Verifica se o servidor está operacional.

```bash
curl http://localhost:3000/api/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2026-07-05T10:30:00.000Z"
}
```

#### `GET /api/challenges`
Lista todos os desafios.

```bash
curl http://localhost:3000/api/challenges
```

Resposta:
```json
[
  {
    "id": "desafio-1",
    "titulo": "Primeiro Desafio",
    "descricao": "...",
    "objetivoPedagogico": "...",
    "blocosPermitidos": [...],
    "regras": {...},
    "dicas": [...]
  },
  ...
]
```

#### `GET /api/challenges/:id`
Obtém um desafio específico pelo ID.

```bash
curl http://localhost:3000/api/challenges/desafio-1
```

#### `GET /api/config`
Retorna configurações gerais da aplicação (ex: versão, modo de banco).

```bash
curl http://localhost:3000/api/config
```

Resposta:
```json
{
  "version": "1.0.0",
  "mode": "in-memory"
}
```

#### `GET /api/ranking`
Lista o ranking de grupos/turmas (ordenado por XP total).

```bash
curl http://localhost:3000/api/ranking
```

Resposta:
```json
[
  {
    "grupoId": "grupo-1",
    "nome": "Grupo A",
    "xpTotal": 1500,
    "posicao": 1
  },
  ...
]
```

#### `POST /api/results`
Submete o resultado de um aluno em um desafio (XP, tentativas, dicas usadas).

```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "grupoId": "grupo-1",
    "alunoId": "aluno-1",
    "desafioId": "desafio-1",
    "xp": 100,
    "tentativas": 2,
    "dicasUsadas": 1
  }'
```

### Administrativos (requerem autenticação)

Todos os endpoints admin exigem o header `x-admin-token` com o valor de `ADMIN_TOKEN`:

```bash
curl -H "x-admin-token: seu-token-secreto" http://localhost:3000/api/admin/challenges
```

#### `POST /api/admin/verify`
Verifica se o token é válido.

```bash
curl -X POST http://localhost:3000/api/admin/verify \
  -H "x-admin-token: seu-token-secreto"
```

Resposta:
```json
{
  "valid": true
}
```

#### `GET /api/admin/challenges`
Lista todos os desafios (idêntico ao público, com autenticação).

```bash
curl -H "x-admin-token: seu-token-secreto" http://localhost:3000/api/admin/challenges
```

#### `POST /api/admin/challenges`
Cria um novo desafio.

```bash
curl -X POST http://localhost:3000/api/admin/challenges \
  -H "x-admin-token: seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "novo-desafio",
    "titulo": "Novo Desafio",
    "descricao": "...",
    "objetivoPedagogico": "...",
    "blocosPermitidos": [...],
    "regras": {...},
    "dicas": [...]
  }'
```

#### `PUT /api/admin/challenges/reorder`
Reordena os desafios (define nova ordem de exibição).

```bash
curl -X PUT http://localhost:3000/api/admin/challenges/reorder \
  -H "x-admin-token: seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "ordem": ["desafio-1", "desafio-2", "desafio-3"]
  }'
```

#### `GET /api/admin/challenges/:id`
Obtém um desafio específico (idêntico ao público, com autenticação).

```bash
curl -H "x-admin-token: seu-token-secreto" http://localhost:3000/api/admin/challenges/desafio-1
```

#### `PUT /api/admin/challenges/:id`
Atualiza um desafio existente.

```bash
curl -X PUT http://localhost:3000/api/admin/challenges/desafio-1 \
  -H "x-admin-token: seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Novo Título",
    "descricao": "Nova descrição",
    ...
  }'
```

#### `DELETE /api/admin/challenges/:id`
Remove um desafio.

```bash
curl -X DELETE http://localhost:3000/api/admin/challenges/desafio-1 \
  -H "x-admin-token: seu-token-secreto"
```

#### `GET /api/admin/config`
Obtém configurações gerais.

```bash
curl -H "x-admin-token: seu-token-secreto" http://localhost:3000/api/admin/config
```

#### `PUT /api/admin/config`
Atualiza configurações gerais.

```bash
curl -X PUT http://localhost:3000/api/admin/config \
  -H "x-admin-token: seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "versao": "1.1.0"
  }'
```

#### `GET /api/admin/dashboard`
Retorna estatísticas do dashboard (desafios cadastrados, grupos ativos, XP total, etc).

```bash
curl -H "x-admin-token: seu-token-secreto" http://localhost:3000/api/admin/dashboard
```

Resposta:
```json
{
  "totalDesafios": 5,
  "totalGrupos": 3,
  "xpTotal": 5000,
  "ultimaAtualizacao": "2026-07-05T10:30:00.000Z"
}
```

## Testando Localmente

Com a variável de ambiente não definida (modo em memória), você pode testar os endpoints com `curl`, Insomnia, Postman ou similar. Exemplo:

```bash
# Terminal 1: rodar o servidor
npm start

# Terminal 2: fazer requisições
curl http://localhost:3000/api/health
curl http://localhost:3000/api/challenges
curl -H "x-admin-token: admin-token-123" http://localhost:3000/api/admin/dashboard
```

Observe que dados são perdidos ao reiniciar. Para persistência, configure o Firebase conforme a seção **Configuração do Firebase** acima e execute `npm run seed`.

## Testes Automatizados

Execute a suíte de testes com:

```bash
npm test
```

Os testes cobrem endpoints públicos e administrativos, validação de autenticação, e integridade de dados.

## Deploy na Render

Para publicar o backend em produção, siga os passos abaixo:

### 1. Conectar Repositório Git

1. Faça push do branch `feat/backend` (ou merge para `main`)
2. Acesse [render.com](https://render.com) e faça login
3. Clique em **"New +"** e selecione **"Web Service"**
4. Escolha **"Deploy an existing Git repository"** e conecte seu repositório GitHub

### 2. Configurar Web Service

- **Name**: `javablocks-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free (ou Starter conforme necessidade)
- **Auto-Deploy**: Ativar (deploy automático a cada push)

### 3. Setar Variáveis de Ambiente

No painel da Web Service, vá para **Environment** e adicione:

```
PORT=3000
ADMIN_TOKEN=seu-token-secreto-prod
CORS_ORIGINS=https://seu-dominio-frontend.com
FIREBASE_PROJECT_ID=seu-projeto-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@seu-projeto-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### 4. Deploy Automático

Assim que salvar as variáveis de ambiente, o Render iniciará o build e deploy automaticamente. Você poderá acompanhar via logs no painel.

A URL pública será algo como:
```
https://javablocks-backend-xxx.onrender.com
```

Atualize a variável `VITE_API_URL` no frontend para esta URL, rebuild e redeploy.

## Modo Em Memória (Sem Firebase)

Se nenhuma credencial do Firebase for fornecida (variáveis `FIREBASE_*` não definidas), o backend operará em **modo em memória**. Neste modo:

- Os dados (desafios, resultados, ranking) são armazenados apenas em RAM
- **Dados são perdidos** quando o servidor reinicia
- Ideal para desenvolvimento local, testes automatizados e prototipagem rápida
- Mensagens no console indicam: `[INFO] Backend running in in-memory mode`

Após popular via `npm run seed` no modo em memória, abra o servidor e teste os endpoints. Reinicie o servidor para limpar os dados.

## Contato & Suporte

Para dúvidas sobre o backend, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**Versão**: 1.0.0  
**Última atualização**: Julho de 2026
