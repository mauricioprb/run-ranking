# Runking

Ranking de corrida integrado com o Strava. Sincroniza atividades de corrida dos membros e exibe uma classificação por distância total percorrida.

## Stack

- **Next.js 16** (App Router, React 19)
- **PostgreSQL 17** + **Drizzle ORM**
- **Tailwind CSS 4** + shadcn/ui
- **Strava API** (OAuth 2.0, webhooks)

## Pré-requisitos

- Node.js 22+
- Docker e Docker Compose (para o banco local)
- Conta de desenvolvedor no [Strava](https://developers.strava.com/)

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd run-ranking
npm install
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

Isso cria um PostgreSQL local na porta 5432 com o banco `run_ranking` e executa a migration inicial automaticamente.

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas credenciais:

| Variável                 | Descrição                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Connection string do PostgreSQL. O padrão local funciona com o docker-compose                            |
| `STRAVA_CLIENT_ID`       | ID do app no [painel Strava](https://www.strava.com/settings/api)                                        |
| `STRAVA_CLIENT_SECRET`   | Secret do app no painel Strava                                                                           |
| `STRAVA_VERIFY_TOKEN`    | Token para verificar o webhook do Strava (pode ser qualquer string)                                      |
| `STRAVA_SUBSCRIPTION_ID` | ID da subscription do webhook (opcional, verificar [docs](https://developers.strava.com/docs/webhooks/)) |
| `CRON_SECRET`            | Token Bearer para proteger o endpoint de sync (`/api/cron/sync`)                                         |
| `NEXT_PUBLIC_APP_URL`    | URL base da aplicação (`http://localhost:3000` em dev)                                                   |
| `TOKEN_ENCRYPTION_KEY`   | Chave de 32 bytes em hex para criptografar tokens. Gerar com: `openssl rand -hex 32`                     |

### 4. Configurar o app no Strava

1. Acesse [strava.com/settings/api](https://www.strava.com/settings/api)
2. Em **Authorization Callback Domain**, configure: `localhost` (dev) ou seu dominio (prod)
3. O redirect URI usado pela app é: `{NEXT_PUBLIC_APP_URL}/api/strava/callback`

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [localhost:3000](http://localhost:3000).

## Scripts

| Comando               | Descricao                          |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento        |
| `npm run build`       | Build de producao                  |
| `npm start`           | Iniciar em producao                |
| `npm run lint`        | ESLint                             |
| `npm run typecheck`   | Verificacao de tipos               |
| `npm run db:generate` | Gerar migration a partir do schema |
| `npm run db:migrate`  | Executar migrations pendentes      |

## Deploy com Docker

### Build da imagem

```bash
docker build -t run-ranking .
```

### Rodar em producao

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/run_ranking" \
  -e STRAVA_CLIENT_ID="..." \
  -e STRAVA_CLIENT_SECRET="..." \
  -e STRAVA_VERIFY_TOKEN="..." \
  -e CRON_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://seu-dominio.com" \
  -e TOKEN_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  run-ranking
```

A imagem inclui health check em `/api/health` (verifica conexao com o banco).

## Webhook do Strava

Para receber eventos em tempo real (nova corrida, edicao, exclusao):

1. Exponha a app publicamente (ex: ngrok para dev, dominio para prod)
2. Crie a subscription:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=SEU_CLIENT_ID \
  -d client_secret=SEU_CLIENT_SECRET \
  -d callback_url=https://seu-dominio.com/api/webhook/strava \
  -d verify_token=SEU_VERIFY_TOKEN
```

3. Anote o `id` retornado e coloque em `STRAVA_SUBSCRIPTION_ID` no `.env.local`

## Sync manual (cron)

Para sincronizar todas as atividades manualmente:

```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  https://seu-dominio.com/api/cron/sync
```

Configure um cron job (ex: GitHub Actions, Railway cron, etc.) para rodar periodicamente.

## Estrutura do projeto

```
src/
  app/                     # Pages e API routes (Next.js App Router)
    api/
      strava/callback/     # OAuth callback do Strava
      cron/sync/           # Endpoint de sync completo
      health/              # Health check
      webhook/strava/      # Webhook do Strava
    auth/login/            # Redirect para OAuth do Strava
  components/              # Componentes React (ranking, analytics, filtros)
  core/
    domain/                # Schemas Zod (atividade, corredor, webhook)
    errors.ts              # Erros tipados do dominio
    repositories/          # Interfaces de repositorio
    services/              # Logica de negocio (auth, sync, ranking)
  hooks/                   # Custom React hooks
  infra/
    db/                    # PostgreSQL (pool, schema Drizzle, repositories)
    strava/                # Gateway da API do Strava
  lib/                     # Utilitarios (crypto, env, rate-limit, utils)
```

## CI/CD

O projeto inclui GitHub Actions (`.github/workflows/ci.yml`) com:

- **Lint + TypeCheck + Build** em todo push/PR para main
- **Security scan** (npm audit + TruffleHog para secrets vazados)
- **Docker build** (apenas em push para main)
