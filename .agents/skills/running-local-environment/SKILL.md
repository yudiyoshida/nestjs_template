---
name: running-local-environment
description: Sobe o ambiente local do template — Postgres e Redis pelo compose de desenvolvimento, .env.development e .env.test, schema, seed e a API em modo watch — e prepara o banco de teste separado do de desenvolvimento. Use quando o usuário pedir para rodar, subir ou iniciar a aplicação ou o ambiente local, preparar o banco de teste, criar ou conferir o .env local, usar o docker compose de desenvolvimento, abrir Swagger, Prisma Studio ou logs locais, ou quando o banco do teste de integração estiver inacessível.
---

# Ambiente local

Deixa a API rodando na máquina e o banco de teste pronto, sem misturar o banco de teste com o de desenvolvimento.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir como subir o ambiente.** Todo o padrão — modos de execução, serviços do compose, chaves que o Joi exige, banco de teste separado, schema, seed, endereços e conferência — está definido aqui e apenas aqui.

Antes de executar, **não**:

- leia README, Dockerfile, compose ou `package.json` para descobrir comando
- rode grep/glob para inferir convenção
- abra skill vizinha

Se arquivo existente contradiz esta skill, **esta skill vence**; avisar o usuário da divergência.

**Permitido ler apenas para executar a tarefa:**

- `.env.example`, para copiar as chaves
- de `.env.development` e `.env.test`, só se cada chave existe e o host, a porta e o database da `DATABASE_URL` (comando da seção "Templates"). Proibido imprimir valor de segredo

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- Dois modos. **Local**, o padrão: Postgres e Redis no Docker, API na máquina com `npm run start:dev`. **Docker**: tudo no compose de desenvolvimento, com hot reload. Docker só quando o pedido nomear.
- O `ConfigModule` carrega `.env.<NODE_ENV>`: `npm run start:dev` lê `.env.development` e `npm test` lê `.env.test`. Os dois ficam fora do git. Só o `.env.example` é versionado.
- O Joi exige em qualquer ambiente: `PORT`, `SSL_KEY`, `SSL_CERT`, `SSL_CA`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN` (número), `DATABASE_URL` e os seis `*_VENDOR`. Os `SSL_*` só são lidos em produção: fora dela, qualquer caminho serve.
- Chave de vendor real (AWS, SMTP, Redis, ViaCEP, CNPJá) só quando o `*_VENDOR` daquela capability não é `fake`.
- Em teste, os seis módulos de vendor usam o fake sozinhos e o teste precisa só do Postgres. O `.env.test` leva `fake` em todos os `*_VENDOR`, porque o Joi exige a chave.
- **Banco de teste separado.** Teste de integração apaga tabelas a cada caso (`deleteMany`). A `DATABASE_URL` do `.env.test` aponta para outro database no mesmo Postgres: `template_test`. Proibido apontar para o banco de desenvolvimento: o `npm test` apagaria os dados dele, inclusive o admin do seed.
- Mesmo host, porta e database nos dois `.env`: corrigir o `.env.test` antes de qualquer `npm test`.
- Schema nos dois bancos: `npm run db:migration` no de desenvolvimento e `npx dotenv -e .env.test -- prisma db push` no de teste. O `db push` cria o database que não existe e gera o Prisma Client.
- Seed só no banco de desenvolvimento. O banco de teste fica vazio: cada spec grava o que usa.
- `npm run db:reset` apaga o banco de desenvolvimento e roda o seed: só com confirmação.
- Segredo local (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`) nasce com `openssl rand -hex 32`, um por chave e por arquivo. Proibido reaproveitar segredo de outro ambiente e imprimir o valor na resposta.
- No modo Docker, o compose sobrescreve `DATABASE_URL` e `REDIS_URL` para os hosts `postgres` e `redis`; o resto vem do `.env.development`. Schema e seed rodam dentro do container `api`.
- `npm run start:dev` fica no ar em modo watch: rodar em segundo plano. A conferência é o `GET /swagger-json`.

## Fluxo

```
Progresso:
- [ ] 1. Escolher o modo: local (padrão) ou Docker (só se o pedido nomear)
- [ ] 2. Conferir .env.development e .env.test: chaves do Joi presentes e bancos diferentes. Arquivo ausente → criar pelo template
- [ ] 3. Subir as dependências
- [ ] 4. Aplicar o schema no banco de desenvolvimento e no de teste
- [ ] 5. Seed no banco de desenvolvimento, quando o pedido quiser dados iniciais
- [ ] 6. Subir a API e conferir o /swagger-json
- [ ] 7. Checklist de entrega
```

Pedido só de banco de teste (teste de integração sem banco): passos 2 a 4, só a parte de teste, sem API.

## Quando usar

| Sintoma | Ação |
|---------|------|
| Rodar, subir ou iniciar a API local | Modo local, passos 1 a 6 |
| Rodar tudo no Docker | Modo Docker |
| Teste de integração sem banco, ou banco de teste a preparar | Passos 2 a 4, parte de teste |
| `.env` local ausente, incompleto ou com os dois bancos iguais | Template do arquivo |
| Swagger, Prisma Studio ou logs locais | Tabela "Endereços" |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Variável de ambiente nova no código | Skill `using-core-config` |
| Seed novo | Skill `writing-prisma-seed` |
| Mudança de schema | Skill `writing-prisma-model` ou `evolving-existing-module` |
| Collection Postman | Skill `syncing-postman-collection` |
| Conferir a entrega (lint, tipos, testes, build) | Skill `verifying-delivery` |
| Produção, deploy, SSL, `docker-compose.yml` | Fora (sem skill) |

## Templates

### Conferir os dois bancos

Mostra host, porta e database sem o usuário e a senha.

```bash
grep -E '^DATABASE_URL=' .env.development .env.test | sed -E 's#=.*@#=#'
```

Saída certa:

```
.env.development:DATABASE_URL=localhost:5432/template
.env.test:DATABASE_URL=localhost:5432/template_test
```

### Dependências (modo local)

Para os testes, basta o `postgres`. O `redis` só é usado com `CACHE_VENDOR=redis`.

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis
```

### Tudo no Docker

```bash
npm run docker:dev
docker compose -f docker-compose.dev.yml exec api npx prisma db push
docker compose -f docker-compose.dev.yml exec api npm run db:seed
```

Derrubar: `npm run docker:dev:down`.

### `.env.development`

`CORS_ORIGIN` leva a origem do front local, separada por vírgula. Vendor real: trocar o `fake` e acrescentar as chaves dele a partir do `.env.example`.

```dotenv
PORT=3000
SSL_KEY=/etc/letsencrypt/live/domain.com/privkey.pem
SSL_CERT=/etc/letsencrypt/live/domain.com/fullchain.pem
SSL_CA=/etc/letsencrypt/live/domain.com/chain.pem
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<openssl rand -hex 32>
REFRESH_TOKEN_EXPIRES_IN=604800
DATABASE_URL=postgresql://postgres:password@localhost:5432/template
UPLOAD_FILE_VENDOR=fake
SMTP_VENDOR=fake
CACHE_VENDOR=fake
CEP_LOOKUP_VENDOR=fake
CNPJ_LOOKUP_VENDOR=fake
LOGGER_VENDOR=winston
```

### `.env.test`

Database `template_test` e todos os vendors `fake`.

```dotenv
PORT=3001
SSL_KEY=/etc/letsencrypt/live/domain.com/privkey.pem
SSL_CERT=/etc/letsencrypt/live/domain.com/fullchain.pem
SSL_CA=/etc/letsencrypt/live/domain.com/chain.pem
CORS_ORIGIN=http://localhost:3001
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<openssl rand -hex 32>
REFRESH_TOKEN_EXPIRES_IN=604800
DATABASE_URL=postgresql://postgres:password@localhost:5432/template_test
UPLOAD_FILE_VENDOR=fake
SMTP_VENDOR=fake
CACHE_VENDOR=fake
CEP_LOOKUP_VENDOR=fake
CNPJ_LOOKUP_VENDOR=fake
LOGGER_VENDOR=fake
```

### Schema e seed

```bash
npm run db:migration
npx dotenv -e .env.test -- prisma db push
npm run db:seed
```

### API e conferência

`200` no `curl`: a API subiu. Erro do Joi no start: a mensagem nomeia a chave que falta no `.env.development`.

```bash
npm run start:dev
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/swagger-json
```

### Endereços

| O quê | Onde |
|---|---|
| API | `http://localhost:<PORT>` |
| Swagger | `/swagger`; o JSON em `/swagger-json` |
| Prisma Studio | `npm run db:studio` |
| Logs | `logs/<contexto>.log`; no modo Docker, também o Dozzle em `http://localhost:9999` |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Variável de ambiente nova | Skill `using-core-config` |
| Seed novo | Skill `writing-prisma-seed` |
| Conferência da entrega | Skill `verifying-delivery` |
| Collection Postman | Skill `syncing-postman-collection` |
| Produção, deploy, SSL | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Modo escolhido; Docker só se o pedido nomeou
- [ ] `.env.development` e `.env.test` com as chaves do Joi; segredo gerado localmente e nunca impresso
- [ ] `.env.test` aponta para `template_test`, diferente do banco de desenvolvimento
- [ ] Schema aplicado nos dois bancos; seed só no de desenvolvimento
- [ ] `db:reset` só com confirmação
- [ ] API respondeu `200` em `/swagger-json`, quando o pedido era subir a API
- [ ] Nenhum `.env` com segredo foi para o git
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
