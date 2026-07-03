# Docker - NestJS Template API

Este documento explica como executar o projeto usando Docker e Docker Compose.

## Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

## Arquivos Docker

- `Dockerfile` - Imagem de produção multi-stage otimizada
- `Dockerfile.dev` - Imagem de desenvolvimento com hot reload
- `docker-compose.yml` - Orquestração para produção
- `docker-compose.dev.yml` - Orquestração para desenvolvimento
- `.dockerignore` - Arquivos ignorados no build

## Serviços

### 1. PostgreSQL 16
- **Imagem:** postgres:16-alpine
- **Porta:** 5432 (padrão)
- **Volume:** postgres_data (persistência dos dados)

### 2. Redis 8
- **Imagem:** redis:8-alpine
- **Porta:** 6379 (padrão)
- **Volume:** redis_data (persistência dos dados)

### 3. API (NestJS Template)
- **Build:** Multi-stage Dockerfile (produção) ou Dockerfile.dev (desenvolvimento)
- **Porta:** 3000 (padrão)
- **Dependências:** PostgreSQL e Redis
- **Health checks:** Aguarda serviços estarem prontos

### 4. Dozzle (apenas desenvolvimento)
- **Porta:** 9999 (padrão)
- **Acesso:** http://localhost:9999
- Visualizador web de logs em tempo real (containers + log watchers)

## Como usar

### Desenvolvimento

**Configure as variáveis de ambiente:**

O container de desenvolvimento usa `NODE_ENV=development` e lê `.env.development` (montado via volume). As variáveis `DATABASE_URL` e `REDIS_URL` são sobrescritas pelo compose para apontar aos hosts Docker (`postgres` e `redis`).

Certifique-se de que `.env.development` existe com as demais variáveis (JWT, AWS, SMTP, etc.).

#### Rodando localmente (só dependências)

1. **Inicie apenas PostgreSQL e Redis:**
   ```bash
   docker compose -f docker-compose.dev.yml up postgres redis -d
   ```

2. **Execute a aplicação localmente:**
   ```bash
   npm install
   npm run db:migration
   npm run db:seed
   npm run start:dev
   ```

#### Rodando com Docker (hot reload)

1. **Execute o docker:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Execute as migrations (primeira vez):**
   ```bash
   docker compose -f docker-compose.dev.yml exec api npx prisma db push
   ```

3. **Execute o seed (opcional):**
   ```bash
   docker compose -f docker-compose.dev.yml exec api npm run db:seed
   ```

4. **Acesse a aplicação:**
   - API: http://localhost:3000
   - Swagger: http://localhost:3000/swagger
   - Dozzle (logs): http://localhost:9999

### Produção

1. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações de produção
   # IMPORTANTE: Altere JWT_SECRET, senhas do banco e credenciais AWS/SMTP
   ```

2. **Configure os certificados SSL:**
   O `main.ts` exige HTTPS em produção (`NODE_ENV=production`). Defina `SSL_KEY`, `SSL_CERT` e `SSL_CA` apontando para arquivos dentro de `/etc/letsencrypt` (montado via volume no compose).

3. **Inicie todos os serviços:**
   ```bash
   docker compose up -d
   ```

4. **Execute as migrations (primeira vez):**
   ```bash
   docker compose exec api npx prisma db push
   ```

5. **Execute o seed (opcional):**
   ```bash
   docker compose exec api npm run db:seed
   ```

6. **Acesse a aplicação:**
   - API: https://localhost:3000 (HTTPS)
   - Swagger: https://localhost:3000/swagger

## Comandos úteis

### Ver logs
```bash
# Todos os serviços (dev)
docker compose -f docker-compose.dev.yml logs -f

# Serviço específico
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f redis
```

### Parar serviços
```bash
# Parar todos
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v
```

### Acessar container
```bash
# Shell do container da API
docker compose exec api sh

# PostgreSQL CLI
docker compose exec postgres psql -U postgres -d template

# Redis CLI
docker compose exec redis redis-cli
```

### Rebuild da imagem
```bash
# Rebuild sem cache
docker compose build --no-cache api

# Rebuild e restart
docker compose up -d --build api
```

### Prisma Studio
```bash
docker compose exec api npx prisma studio
```

## Volumes

Os dados são persistidos em volumes Docker:
- `postgres_data` / `postgres_dev_data` - Dados do PostgreSQL
- `redis_data` / `redis_dev_data` - Dados do Redis

Para fazer backup dos dados:
```bash
# PostgreSQL
docker compose exec postgres pg_dump -U postgres template > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres -d template < backup.sql
```

## Troubleshooting

### Container não inicia
```bash
# Verifique os logs
docker compose logs api

# Verifique o status
docker compose ps
```

### Porta já em uso
```bash
# Altere a porta no arquivo .env
PORT=3001
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### Limpar tudo e recomeçar
```bash
# Para todos os containers e remove volumes
docker compose down -v

# Remove imagens
docker compose down --rmi all
```

## Variáveis de Ambiente Importantes

Certifique-se de configurar estas variáveis em produção:

- `JWT_SECRET` - Chave secreta do JWT (OBRIGATÓRIO)
- `POSTGRES_PASSWORD` - Senha do PostgreSQL (OBRIGATÓRIO)
- `SSL_KEY` / `SSL_CERT` / `SSL_CA` - Caminhos dos certificados TLS (OBRIGATÓRIO em produção)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_BUCKET_NAME` - Upload S3
- `SMTP_*` - Configurações de email
- `CORS_ORIGIN` - Origem permitida para CORS
- `VIACEP_API_URL` - URL da API ViaCEP (padrão: https://viacep.com.br/ws)

## Otimizações de Produção

O Dockerfile de produção inclui:
- **Multi-stage build** - Separa build de runtime
- **Alpine Linux** - Imagem menor
- **Non-root user** - Segurança
- **dumb-init** - Gerenciamento correto de sinais
- **Cache de layers** - Build mais rápido
- **Apenas dependências de produção** - Imagem menor
