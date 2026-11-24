---
name: removing-module
description: Remove um módulo inteiro, ou as sobras de um módulo já apagado, de todos os lugares onde ele foi registrado — AppModule ou consumidor, TOKENS, literal de cache, seed, model Prisma, tabela nos dois bancos e collection Postman — com confirmação da perda de dados e greps que provam que nada sobrou. Use quando o usuário pedir para remover, apagar ou desligar um módulo, limpar sobras de módulo removido, tirar model ou tabela que não tem mais módulo, ou removing-module.
---

# Remoção de módulo

Tira um módulo do template sem deixar registro órfão: código, tokens, cache, seed, tabelas e Postman.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de remoção.** Todo o padrão — o que procurar, dependente que bloqueia, ordem, perda de dado, schema nos dois bancos e prova de que nada sobrou — está definido aqui e apenas aqui.

Antes de remover, **não**:

- leia outro módulo para entender como ele foi montado
- abra skill vizinha para aprender seção ou template
- apague arquivo de `src/shared`, `src/infra` ou `src/core` além da linha da tabela "O que sai"

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa:**

- o que o usuário indicou como entrada
- os nomes de pastas e arquivos de `src/app/<modulo>/`
- a saída dos greps da seção "Templates"
- cada arquivo de registro da tabela "O que sai" — só para tirar a linha do módulo

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- Sai só o módulo que o pedido nomeia. Módulo sem pasta em `src/app/`, mas com sobras (token, model, seed, literal de cache): saem as sobras.
- Dependente bloqueia: arquivo fora da pasta que importa do módulo, por caminho absoluto ou relativo, ou model Prisma de outro arquivo com `@relation` para o model dele. Parar e listar. Mudar o dependente é outro pedido, na skill `evolving-existing-module`.
- Coluna solta em outro model que guarda o id deste (`<camel>Id`): avisar no recap. O valor passa a apontar para nada.
- Apagar o model derruba a tabela e os dados dela nos dois bancos. O recap lista o que sai e o que some, e a remoção só começa com confirmação.
- O `db push` sem a flag avisa só tabela com dado; tabela vazia some calada. Antes da flag, ver o SQL inteiro de cada banco (`prisma migrate diff`, seção "Templates"). Tabela fora do pedido no SQL, sobra antiga do banco: parar e perguntar, porque a flag apagaria ela junto.
- Em produção, o `docker-compose.yml` roda `npx prisma db push` sem `--accept-data-loss`: tabela com dado derruba o start do container. Avisar no recap.
- Ordem da tabela "O que sai": quem registra, pasta, token, cache, seed, model, bancos, `AGENTS.md`, Postman. Código sai antes da tabela.
- Linha cuja peça não existe: pular.
- Token, literal de cache e enum saem só quando o grep não acha outro uso. Spec que usa o literal de cache como exemplo (o do builder) troca para outro recurso da union.
- O que é compartilhado fica: `src/shared`, `src/infra`, `src/core` (fora a chave do token), erros e value objects globais.
- Prova: os greps de sobra sem resultado do módulo. Resultado que não é dele (ex.: `@db.Text` ao remover `text`) não conta.
- Fim: skill `verifying-delivery`. Módulo com HTTP muda o contrato, e a collection Postman é regerada.

## Fluxo

```
Progresso:
- [ ] 1. Identificar as peças: pasta, XxxModule, model(s), tokens, literal de cache, seed
- [ ] 2. Procurar dependentes e relações. Achou: parar e listar
- [ ] 3. Recap: o que sai, tabelas e dados que somem, colunas soltas em outros models, aviso de produção. Esperar confirmação
- [ ] 4. Remover na ordem da tabela "O que sai"
- [ ] 5. Schema nos dois bancos
- [ ] 6. Greps de sobra sem resultado do módulo
- [ ] 7. verifying-delivery, com o Postman quando o módulo tinha HTTP
- [ ] 8. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Remover um módulo inteiro | Fluxo inteiro |
| Limpar sobras de módulo já apagado (token, model, literal, seed) | Fluxo, pulando a linha da pasta |
| Tirar model ou tabela que não tem módulo | Linhas de model e bancos |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Remover campo ou rota de módulo que fica | Skill `evolving-existing-module` |
| Mudar o dependente que bloqueia a remoção | Skill `evolving-existing-module` |
| Remover gateway de vendor em `src/infra` | Fora (sem skill) |

## Bloco base

Arquivos de registro. Localizar antes de editar. Ausente: pular a linha dele na tabela "O que sai".

| Símbolo | Localizar por | Arquivo conhecido |
|---------|---------------|-------------------|
| `AppModule` | `export class AppModule` | `src/app.module.ts` |
| `TOKENS` | `export { TOKENS }` | `src/core/di/token.ts` |
| `CacheKeyBuilder` | `export class CacheKeyBuilder {` | `src/infra/cache/helpers/cache-key/cache-key.builder.ts` |
| Runner de seed | `async function main` | `prisma/seeds/index.ts` |

```bash
grep -rn "export class AppModule" src
grep -rn "export { TOKENS }" src
grep -rn "export class CacheKeyBuilder {" src
grep -n "async function main" prisma/seeds/index.ts
```

## O que sai

| Ordem | Onde | O que sai | Condição |
|---|---|---|---|
| 1 | `src/app.module.ts` (HTTP) ou o módulo consumidor (interno) | o import e a entrada de `XxxModule` em `imports` | se existir |
| 2 | `src/app/<kebab>/` | a pasta inteira, com os specs | se existir |
| 3 | `src/core/di/token.ts` | as chaves `XxxDao` e `XxxRepository` | sem outro uso |
| 4 | `src/infra/cache/helpers/cache-key/cache-key.builder.ts` | o literal `'<kebab>'` da union `Resource`; o spec do builder troca o exemplo | sem outro `setResource('<kebab>')` |
| 5 | `prisma/seeds/<kebab>.ts` e `prisma/seeds/index.ts` | o arquivo, o import e o `await XxxSeed.seed(prisma)` | se existir |
| 6 | `prisma/schema/<kebab>.prisma` | o arquivo | sem `@relation` de outro model |
| 7 | banco de desenvolvimento e banco de teste | a tabela, pelo `db push` | depois da confirmação |
| 8 | `AGENTS.md` | a linha de drift que cita arquivo do módulo | se existir |
| 9 | `postman/swagger.json` e a collection | as rotas do módulo | módulo com HTTP, pela `verifying-delivery` |

## Templates

`Xxx` é o PascalCase do model e das classes, `<kebab>` é o nome da pasta e do arquivo, `<camel>` é o camelCase do model.

Dependentes e relações, antes do recap:

```bash
# import do módulo fora da pasta dele, por caminho absoluto ou relativo
grep -rnE "from '[^']*/<kebab>/" src --include='*.ts' | grep -v "^src/app/<kebab>/"

# @relation de outro model para este
grep -rnw "Xxx" prisma/schema | grep -v "prisma/schema/<kebab>.prisma"

# coluna solta com o id deste em outro model
grep -rn "<camel>Id" prisma/schema | grep -v "prisma/schema/<kebab>.prisma"

# outro uso do literal de cache
grep -rn "setResource('<kebab>')" src
```

Schema nos dois bancos. Primeiro sem a flag: tabela vazia sai direto; tabela com dado, o Prisma recusa e mostra quantas linhas tem.

```bash
npm run db:migration
npx dotenv -e .env.test -- prisma db push
```

Recusou: ver o SQL inteiro, sem executar nada. Só as tabelas do recap podem aparecer.

```bash
npx dotenv -e .env.development -- prisma migrate diff --from-schema-datasource prisma/schema --to-schema-datamodel prisma/schema --script
npx dotenv -e .env.test -- prisma migrate diff --from-schema-datasource prisma/schema --to-schema-datamodel prisma/schema --script
```

SQL só com as tabelas do recap, já confirmado:

```bash
npm run db:migration -- --accept-data-loss
npx dotenv -e .env.test -- prisma db push --accept-data-loss
```

Prova de que nada sobrou:

```bash
grep -rnwE "Xxx[A-Za-z]*" src prisma AGENTS.md
grep -rnE "app/<kebab>/|'<kebab>'|<kebab>\.prisma" src prisma AGENTS.md
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Dependente que bloqueia | Skill `evolving-existing-module` |
| Campo ou rota de módulo que fica | Skill `evolving-existing-module` |
| Conferência e Postman | Skill `verifying-delivery` |
| Gateway de vendor | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Só o módulo nomeado saiu; sem pasta, só as sobras
- [ ] Dependentes e relações procurados antes do recap; nenhum bloqueava
- [ ] Recap confirmado com tabelas, dados, colunas soltas e o aviso de produção
- [ ] Remoção na ordem da tabela "O que sai"; código antes da tabela
- [ ] Token, literal de cache e enum só saíram sem outro uso; spec do builder ajustado quando o literal saiu
- [ ] Schema nos dois bancos; `--accept-data-loss` só depois da confirmação e com o SQL do `migrate diff` restrito às tabelas do recap
- [ ] Greps de prova sem resultado do módulo
- [ ] `verifying-delivery` rodou; Postman regerado quando o módulo tinha HTTP
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
