---
name: evolving-existing-module
description: Conduz a mudança num módulo que já existe — campo novo, alterado ou removido, e endpoint, query, comando ou transição de status novos — na ordem certa, delegando cada arquivo à skill pontual. Use quando o usuário pedir para adicionar, alterar, renomear ou remover campo ou coluna de módulo existente, criar endpoint, rota, query, comando ou transição de status em módulo que já existe, ou evolving-existing-module.
---

# Evolução de módulo existente

Muda um módulo que já existe sem quebrar o que já funciona: lista os arquivos que a mudança toca, na ordem, e delega cada um à skill pontual.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de evolução de módulo.** Todo o padrão — formato do módulo, arquivos que cada mudança toca, ordem, contrato passado a cada skill, banco de desenvolvimento e de teste, mudança que perde dado, specs e Postman — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia outro módulo para copiar formato
- rode grep/glob para inferir convenção
- abra skill vizinha para aprender seção, algoritmo ou template
- corrija drift que o pedido não nomeou

Se código existente contradiz esta skill ou a skill pontual, **a skill vence** no trecho novo. O resto do arquivo fica como está.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- os nomes de pastas e arquivos de `src/app/<modulo>/`, para saber o formato do módulo
- cada arquivo da tabela da mudança que o passo vai editar — só esse arquivo, só para editar
- o spec que já existe do arquivo editado, para estendê-lo
- o grep do nome do campo, na remoção, só para achar o uso que sobrou

A skill pontual citada em "Delegar a" escreve o trecho dela. Abrir a skill pontual na hora de escrever aquele trecho é executar a delegação, não aprender o formato desta orquestração.

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- O módulo já existe. Ausente: não é evolução; parar e nomear `create-new-feature`.
- O formato sai da árvore do módulo. Nas tabelas, **rico** é módulo com `domain/entities/` (inclui interno com agregado) e **HTTP** é módulo com `infra/drivers/http/`. Esta skill não muda o formato: anêmico que passou a ter invariante é outro pedido; parar e avisar.
- Cada trecho novo segue a skill pontual. Drift que já existe no arquivo fica, salvo o pedido nomear.
- Fato que falta (tipo, obrigatoriedade, superfície, valor das linhas antigas, verbo e caminho da rota): perguntar antes do primeiro arquivo.
- Campo novo entra só nas superfícies que o pedido nomear: create, edit, read model, filtro de lista, busca.
- Coluna obrigatória nova em tabela com linhas precisa de `@default` ou do valor que o pedido der para as linhas que já existem. Sem isso, parar e perguntar.
- Mudança que pode perder dado — remover coluna, renomear, trocar tipo, encurtar tamanho, tornar obrigatória sem default — entra no recap com o efeito no dado e só segue com confirmação. `--accept-data-loss` só depois dela, e depois de ver o SQL inteiro do `prisma migrate diff` (seção "Templates"): tabela ou coluna fora do pedido no SQL para e pergunta.
- Renomear coluna mantendo o dado: o campo novo leva `@map("nomeAntigo")`. Sem `@map`, o `db push` apaga a coluna e cria outra vazia.
- Em produção, o `docker-compose.yml` roda `npx prisma db push` sem `--accept-data-loss`: mudança que perde dado derruba o start do container. Avisar no recap.
- Schema aplicado nos dois bancos, desenvolvimento e teste (seção "Templates"). Banco de teste ausente ou igual ao de desenvolvimento: skill `running-local-environment`.
- Remoção: tirar primeiro os usos no código, depois a coluna. O build acusa o que sobrou.
- Use case novo entra em `providers` do `<modulo>.module.ts`; no módulo interno, também em `exports`. Controller novo entra em `controllers`.
- Rota nova: verbo e caminho vêm do pedido. Regra de dono igual à do módulo: admin omite `actorId`, user manda `user.sub`.
- Controller não muda por campo novo: o campo viaja no DTO, e o Swagger lê o `@ApiProperty` dele.
- Spec: cada arquivo de produção que mudou passa por `inventorying-test-scenarios`. O spec que já existe é estendido, não reescrito. Arrange que grava linha ganha a coluna obrigatória nova.
- Contrato HTTP mudou (campo em body, resposta ou query, ou rota nova): Postman pela skill `syncing-postman-collection`.
- Leitura com cache (`caching-a-read`): o read model antigo pode sair do cache até o TTL vencer.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o módulo existe e ler os nomes da árvore dele para saber o formato
- [ ] 2. Classificar a mudança: campo novo, campo alterado, campo removido, ou endpoint ou comando novo
- [ ] 3. Fechar os fatos que faltam. Perda de dado ou coluna obrigatória em tabela com linhas: confirmar o efeito antes de qualquer arquivo
- [ ] 4. Seguir a tabela da mudança, na ordem, delegando cada linha. Pular a linha que o formato do módulo ou o pedido não pede
- [ ] 5. Aplicar o schema no banco de desenvolvimento e no de teste
- [ ] 6. Inventariar os arquivos de produção que mudaram e estender os specs
- [ ] 7. Conferir a entrega pela skill verifying-delivery: build, suítes e Postman
- [ ] 8. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Campo ou coluna nova em módulo existente | Tabela "Campo novo" |
| Renomear campo, trocar tipo, obrigatoriedade ou tamanho | Tabela "Campo alterado" |
| Remover campo ou coluna | Tabela "Campo removido" |
| Endpoint, query, comando, comando interno ou transição de status novos | Tabela "Endpoint ou comando novo" |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Módulo novo | Skill `create-new-feature`, depois a scaffold |
| Escolher entre anêmico, rico e interno | Skill `choosing-module-shape` |
| Converter anêmico em rico | Fora (sem skill) |
| Remover o módulo inteiro | Skill `removing-module` |
| Bug ou refactor sem campo nem rota nova | Fora (sem skill) |
| Gateway de vendor | Skill `using-ports-and-adapters` |

## Bloco base

Localizar o módulo pelo export antes de qualquer arquivo. Serve para confirmar que ele existe. Ausente: parar. Esta skill não cria módulo.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `XxxModule` | `export class XxxModule` | Parar e nomear `create-new-feature` |

```bash
grep -rn "export class XxxModule" src/app
```

Trocar `Xxx` pelo PascalCase do módulo do pedido.

## Campo novo

Uma linha por arquivo. Pular a linha cujo formato não bate ou que o pedido não pede.

| Ordem | Arquivo | Formato | Delegar a | Contrato a passar |
|---|---|---|---|---|
| 1 | `prisma/schema/<modulo>.prisma` | todos | `writing-prisma-model` | Coluna pela tabela "Tipo do campo". Obrigatória em tabela com linhas: `@default` ou o valor confirmado. `@@index` se for id de outro módulo ou filtro da lista |
| 2 | `domain/enums/<nome>.enum.ts` | rico | `creating-domain-enum` | Só se o campo for enum novo |
| 3 | value object | todos | `creating-value-objects` | Só se o campo tem formato (e-mail, CPF, CNPJ, telefone, CEP) e o VO não existe |
| 4 | `domain/entities/<modulo>.entity.ts` | rico | `creating-domain-entity` | Campo em `XxxCreateProps` quando vem do pedido; em `XxxProps` quando a factory define |
| 5 | `domain/factories/<modulo>.factory.ts` | rico | `creating-domain-factory` | `create*` grava o campo, pelo VO quando tem formato. Editável: entra em `XxxEditProps` e numa linha do `edit`. Invariante: `validateCreateProps` |
| 6 | `usecases/create-<modulo>/dtos/create-<modulo>.dto.ts` | HTTP | `creating-application-dtos` | Só se o create recebe o campo |
| 7 | `usecases/edit-<modulo>/dtos/edit-<modulo>.dto.ts` | HTTP | `creating-application-dtos` | Só se o campo é editável. PATCH: opcional |
| 8 | `application/dtos/<modulo>.dto.ts` | todos | `creating-application-dtos` | Read model, se a leitura expõe o campo. Senha, token ou documento: só no `XxxWithSensitiveDataDto`, com o método sensível de `creating-persistence-ports` |
| 9 | `usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto.ts` | HTTP | `creating-application-dtos` | Só se o campo vira filtro da lista |
| 10 | `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` | todos | `implementing-prisma-adapters` | Select; `mapToDto` para enum ou data sem hora; `where` do filtro; `OR` da busca se o texto é buscado; no anêmico, conversão de data sem hora no `save` e no `edit` |
| 11 | `infra/driven/persistence/prisma/<modulo>-prisma.repository.ts` | rico | `implementing-prisma-adapters` | Coluna no `save` e no `edit` a partir de `entity.props`; campo no `Factory.load` do `findById` |
| 12 | `usecases/create-<modulo>/create-<modulo>.service.ts` | rico; anêmico com formato | `creating-use-case` | Rico: o campo entra no objeto explícito que vai para `Factory.create`. Anêmico: o VO antes do `save` |
| 13 | `usecases/edit-<modulo>/edit-<modulo>.service.ts` | anêmico com formato | `creating-use-case` | O VO antes do `dao.edit`, só quando o campo veio. No rico, o `edit` da factory já cobre |
| 14 | `prisma/seeds/<kebab>.ts` | todos | `writing-prisma-seed` | Só se o model tem seed e a coluna é obrigatória sem default |
| 15 | porta, adapter, use cases e controller | todos | `handling-unique-constraints` | Só se o campo é único |

## Campo alterado

Cada linha de código delega à skill da linha correspondente em "Campo novo". O build acusa o lugar que ficou para trás.

| Mudança | Banco | Código |
|---|---|---|
| Renomear | Perde o dado sem `@map("nomeAntigo")`. Com `@map`, a coluna não muda | Trocar o nome em cada linha de "Campo novo" que o campo ocupa |
| Trocar tipo | Pode perder dado: confirmar | Coluna, validator do DTO, tipo do read model, `mapToDto`, props da entidade, repository |
| Opcional → obrigatório | Linha com `null` impede o `db push`: `@default` ou valor para as linhas que já existem | Create sem `@IsOptional`. Edit continua opcional (PATCH). Read model sem `\| null` |
| Obrigatório → opcional | Sem perda | `?` no model, `\| null` no read model, `@IsOptional` no create |
| Tamanho (`@db.VarChar(n)`) | Encurtar pode falhar ou cortar: confirmar | `@MaxLength` do DTO igual ao `n` |
| Tornar único | Linha repetida impede o `db push`: limpar antes, com confirmação | Skill `handling-unique-constraints` |

## Campo removido

O código sai antes da coluna.

| Ordem | Trecho | Delegar a |
|---|---|---|
| 1 | Campo nos DTOs de create, edit e query e no read model | `creating-application-dtos` |
| 2 | Select, `where`, `OR` da busca, `mapToDto` e conversões do DAO | `implementing-prisma-adapters` |
| 3 | `save`, `edit` e `Factory.load` do repository (rico) | `implementing-prisma-adapters` |
| 4 | `create*`, `XxxEditProps`, linha do `edit` e `validateCreateProps` da factory (rico) | `creating-domain-factory` |
| 5 | Props e predicados da entidade que leem o campo (rico) | `creating-domain-entity` |
| 6 | Objeto do `Factory.create` no use case (rico) ou VO do anêmico | `creating-use-case` |
| 7 | Campo no seed | `writing-prisma-seed` |
| 8 | Coluna no `.prisma`, depois o schema nos dois bancos com a confirmação de perda | `writing-prisma-model` |
| 9 | Enum que só esse campo usava: apagar o arquivo se o grep não achar outro uso | — |

## Endpoint ou comando novo

| Caso | Arquivos, na ordem | Delegar a |
|---|---|---|
| Transição de status (rico) | erro da transição ilegal (422); membro novo no enum, se o status é novo; método da entidade no molde `expire()`; use case de comando rico (carrega, `NotFound`, dono, método, `repository.edit`); método no controller; `providers` | `creating-custom-errors`, `creating-domain-enum`, `creating-domain-entity`, `creating-use-case`, `creating-controllers` |
| Transição de status (anêmico) | use case de comando anêmico que grava a coluna por `dao.edit`; método no controller; `providers` | `creating-use-case`, `creating-controllers` |
| Query nova (busca por outro campo, leitura com outro recorte) | método na porta `IXxxDao`; método no adapter DAO; DTO que faltar; use case de query; método no controller; `providers` | `creating-persistence-ports`, `implementing-prisma-adapters`, `creating-application-dtos`, `creating-use-case`, `creating-controllers` |
| Comando anêmico novo | DTO de input; método na porta, se a escrita não é `save`, `edit` ou `delete`; adapter; use case; controller; `providers` | `creating-application-dtos`, `creating-persistence-ports`, `implementing-prisma-adapters`, `creating-use-case`, `creating-controllers` |
| Outro `create*` (rico) | método `create*` na factory; par de DTOs; use case de comando rico; controller; `providers` | `creating-domain-factory`, `creating-application-dtos`, `creating-use-case`, `creating-controllers` |
| Comando interno (sem HTTP) | use case de comando interno; `providers`, e `exports` no módulo interno. Sem controller | `creating-use-case` |
| Superfície nova (user onde só havia admin) | controller; `controllers` do módulo; `AuthenticationGuardsModule` em `imports` se houver `RequiredRoles` e o import faltar | `creating-controllers` |

## Templates

Schema nos dois bancos. `db:migration` usa o `.env.development`; o banco de teste usa o `.env.test`, o mesmo que o `npm test` carrega.

```bash
npm run db:migration
npx dotenv -e .env.test -- prisma db push
```

Antes da flag, o SQL inteiro de cada banco, sem executar nada:

```bash
npx dotenv -e .env.development -- prisma migrate diff --from-schema-datasource prisma/schema --to-schema-datamodel prisma/schema --script
npx dotenv -e .env.test -- prisma migrate diff --from-schema-datasource prisma/schema --to-schema-datamodel prisma/schema --script
```

Só depois de o usuário confirmar a perda de dado, e com o SQL restrito ao pedido:

```bash
npm run db:migration -- --accept-data-loss
npx dotenv -e .env.test -- prisma db push --accept-data-loss
```

Renomear mantendo o dado: o campo muda no código e a coluna fica.

```prisma
model Xxx {
  nomeNovo String @map("nomeAntigo")
}
```

Conferência no fim: skill `verifying-delivery`.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Módulo novo | Skill `create-new-feature` e a scaffold do formato |
| Cada arquivo das tabelas | A skill da linha |
| Converter anêmico em rico | Fora (sem skill) |
| Remover o módulo inteiro | Skill `removing-module` |
| Invalidar cache numa escrita | Fora (sem skill) |
| Teste e2e | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] O módulo já existia; o formato saiu da árvore e não mudou
- [ ] Só as linhas que o formato e o pedido pedem foram feitas, na ordem da tabela da mudança
- [ ] Cada trecho foi escrito pela skill da linha; drift antigo ficou como estava, salvo pedido
- [ ] Campo novo só nas superfícies que o pedido nomeou
- [ ] Coluna obrigatória em tabela com linhas tem `@default` ou valor confirmado
- [ ] Perda de dado confirmada no recap, com o aviso do `db push` em produção; `--accept-data-loss` só depois disso
- [ ] Schema aplicado no banco de desenvolvimento e no de teste
- [ ] Remoção: usos tirados antes da coluna; build e grep sem resto
- [ ] Use case novo em `providers` (e `exports` no interno); controller novo em `controllers`
- [ ] `inventorying-test-scenarios` rodou em cada arquivo de produção que mudou; specs existentes estendidos
- [ ] `verifying-delivery` rodou, com build, suítes, Postman e o relatório
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
