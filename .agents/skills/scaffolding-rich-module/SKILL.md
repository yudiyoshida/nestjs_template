---
name: scaffolding-rich-module
description: Gera o módulo HTTP rico na árvore canônica, com entidade, factory, enum e duas portas, delegando cada arquivo à skill pontual. Use quando o usuário pedir para criar módulo rico, scaffold em que estado inválido não pode existir, módulo no estilo Tip, ou scaffolding-rich-module.
---

# Scaffold de módulo rico

Gera o módulo HTTP em que estado inválido não pode existir, na árvore canônica, delegando cada arquivo à skill pontual.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de módulo rico.** Todo o padrão — árvore, ordem, leis, contratos passados a cada skill, módulo Nest e import no `AppModule` — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra `src/app/_examples` nem skill vizinha para aprender seção, algoritmo ou template
- copie template de entidade, factory, enum, DTO, porta, adapter, use case, controller, model Prisma ou erro

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada (nome do módulo, colunas, enums, papel e comandos)
- arquivo que exporta `AppModule` ou `AuthenticationGuardsModule` — só para inserir ou reusar (seção "Bloco base")

A skill pontual citada em "Delegar a" é quem escreve o arquivo dela. Esta skill não reproduz o corpo desse arquivo. Abrir a skill pontual na hora de escrever aquele arquivo é executar a delegação, não aprender o formato desta orquestração.

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

### Leis

- Estado inválido não pode existir. Entidade, factory e os enums que o pedido nomear. Duas portas.
- Pasta do módulo em kebab, singular. URL em inglês no plural: `admin/<plural>` e `user/<plural>`. `tip` vira `tips`. Proibido singular na URL.
- Tag Swagger: um texto só, o recurso no plural, igual em admin e user. Sem prefixo nem sufixo de canal.
- Enum com valor explícito `SCREAMING_SNAKE`. Coluna no Prisma é `String`. Valores vêm do pedido. Proibido valor `'Active'` ou `'Ativo'`.
- DAO só leitura. `findAll` devolve `[Dto[], number]`. `findById` devolve `Dto | null`. Query não instancia entidade.
- Repository: `save` e `edit` recebem a entidade. `findById` devolve `Entity | null`. `delete(id)`.
- Comando (`create`, `edit`, transição de status): factory ou método da entidade, depois o repository.
- `findById` exposto por HTTP: `null` da porta lança `XxxNotFoundError`. O controller devolve o DTO.
- Delete físico: carregar a entidade (para `NotFound` e dono) e chamar `repository.delete(id)`. Proibido método `remove()` no lugar do delete.
- Transição de status, quando o pedido tiver: método da entidade. O molde do nome é `expire()`. O use case carrega, chama o método e `repository.edit`.
- Dono: `actorId?` em edit e delete. Admin omite o argumento. User manda `user.sub`. Dono errado lança o mesmo `XxxNotFoundError` do recurso ausente.
- Create guarda quem criou. Admin e user passam `user.sub` como `createdBy`. `createdBy` não é `actorId`.
- Edição com campo opcional é `PATCH`.
- Admin: `@RequiredRoles(AccountRole.ADMIN)` na classe. User: `@RequiredRoles(<papel>)` na classe. O papel é o que o pedido nomear, valor já existente de `AccountRole`. Pedido sem papel: parar e pedir o papel. Proibido inventar papel.
- Controller sem `if` de negócio. Só chama `execute`. Proibido reescrever a query no controller. Filtro fixo, se o pedido pedir, mora no use case.
- Comando interno sem HTTP (lote): só se o pedido pedir. Mesma classe de use case, entra nos `providers`, sem rota. Registro ausente pode ser ignorado.
- A receita não inventa segundo create, comando de lote nem enum. Cada um entra só quando o pedido o nomeia.
- Import absoluto `src/...`. Proibido import relativo no `<modulo>.module.ts`.
- Módulo com HTTP entra em `AppModule` na hora em que nasce. Sem `exports`.
- Classe do use case sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`.
- Create devolve `{ id }`. Edit e delete devolvem `SuccessMessage`.
- `:id` usa `Params`. Query de lista estende `Queries`. Proibido DTO novo de id, de paginação ou de mensagem.
- Token `XxxDao` e `XxxRepository` (`Symbol.for`, nome sem `I`). Use case injeta o token. Proibido importar a classe do adapter no use case.
- Documentação HTTP só pelo helper `Swagger`.
- Lista com `Promise.all` de `findMany` e `count` pertence ao adapter. Aqui só se delega.
- Colunas, valores de enum e comandos extras vêm do pedido.

### Árvore

```
src/app/<modulo>/
  <modulo>.module.ts
  domain/entities/<modulo>.entity.ts
  domain/enums/<nome>.enum.ts
  domain/errors/<modulo>-not-found.error.ts
  domain/factories/<modulo>.factory.ts
  application/dtos/<modulo>.dto.ts
  application/persistence/<modulo>-persistence.module.ts
  application/persistence/dao/<modulo>-dao.interface.ts
  application/persistence/repository/<modulo>-repository.interface.ts
  application/usecases/create-<modulo>/
    create-<modulo>.service.ts
    dtos/create-<modulo>.dto.ts
  application/usecases/find-all-<modulo>/
    find-all-<modulo>.service.ts
    dtos/find-all-<modulo>.dto.ts
  application/usecases/find-<modulo>-by-id/
    find-<modulo>-by-id.service.ts
  application/usecases/edit-<modulo>/
    edit-<modulo>.service.ts
    dtos/edit-<modulo>.dto.ts
  application/usecases/delete-<modulo>/
    delete-<modulo>.service.ts
  infra/driven/persistence/prisma/<modulo>-prisma.dao.ts
  infra/driven/persistence/prisma/<modulo>-prisma.repository.ts
  infra/drivers/http/admin/<modulo>-admin.controller.ts
  infra/drivers/http/user/<modulo>-user.controller.ts
prisma/schema/<modulo>.prisma
```

Enum só entra na árvore quando o pedido nomeia o tipo ou o status. Comando extra ou comando interno ganha a própria pasta `application/usecases/<verbo>-<modulo>/` e não ganha controller quando for interno. Também entram as chaves `XxxDao` e `XxxRepository` em `src/core/di/token.ts` e o import de `XxxModule` em `src/app.module.ts`.

Nomes com módulo `tip`: pasta `tip`, classes `TipModule`, `Tip`, `TipFactory`, `CreateTip`, `FindAllTip`, `FindTipById`, `EditTip`, `DeleteTip`, `ITipDao`, `ITipRepository`, `TipDaoAdapterPrisma`, `TipRepositoryAdapterPrisma`, `TipPersistenceModule`, `TipNotFoundError`, `TipDto`, `TipAdminController`, `TipUserController`. URL `admin/tips` e `user/tips`. Tag `Tips`.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o caso rico e o papel do user
- [ ] 2. Fixar pasta, classes, plural da URL e tag
- [ ] 3. Delegar os arquivos na ordem da tabela
- [ ] 4. Escrever <modulo>.module.ts pelo template
- [ ] 5. Inserir XxxModule em AppModule
- [ ] 6. Inventariar cenários e delegar os specs
- [ ] 7. Checklist de entrega
```

1. Confirmar que estado inválido não pode existir. CRUD sem invariante que o objeto precise proteger: parar e nomear `scaffolding-anemic-module`. Módulo sem HTTP: parar e nomear `scaffolding-internal-module`. Não criar arquivo. O papel do user falta no pedido: parar e pedir o papel. Não criar arquivo.

2. Fixar a pasta kebab singular, o PascalCase `Xxx`, o plural inglês da URL, a tag única e o papel do user. Guardar colunas, enums e comandos do pedido para as delegações.

3. Delegar na ordem abaixo. Cada linha é uma entrega da skill citada. Não escrever o corpo do arquivo nesta skill.

| Ordem | Arquivo | Delegar a | Contrato a passar |
|---|---|---|---|
| 1 | `domain/enums/<nome>.enum.ts`, um arquivo por enum que o pedido nomear | `creating-domain-enum` | Valor `SCREAMING_SNAKE`. Sem enum, pular a linha |
| 2 | `domain/errors/<modulo>-not-found.error.ts` | `creating-custom-errors` | Classe `XxxNotFoundError`, 404, mensagem `<Recurso> não encontrado na base de dados.` |
| 3 | `domain/entities/<modulo>.entity.ts` | `creating-domain-entity` | Invariante do pedido. Delete físico não vira método. Transição de status, se houver, método da entidade; molde do nome `expire()` |
| 4 | `domain/factories/<modulo>.factory.ts` | `creating-domain-factory` | Único lugar que chama `_instantiate`. Falha de validação é classe de erro, criada por `creating-custom-errors` |
| 5 | `prisma/schema/<modulo>.prisma` | `writing-prisma-model` | Colunas do pedido. Enum de domínio como `String` |
| 6 | `application/dtos/<modulo>.dto.ts` | `creating-application-dtos` | Read model plano, sem `class-validator` |
| 7 | `usecases/create-<modulo>/dtos/create-<modulo>.dto.ts` | `creating-application-dtos` | `CreateXxxInputDto` e, no mesmo arquivo, `CreateXxxOutputDto` com `{ id: string }`. Um arquivo por comando de create que o pedido distinguir |
| 8 | `usecases/edit-<modulo>/dtos/edit-<modulo>.dto.ts` | `creating-application-dtos` | `EditXxxInputDto` com campos opcionais (`PATCH`) |
| 9 | `usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto.ts` | `creating-application-dtos` | `FindAllXxxQueryDto` estende `Queries`. Filtro extra só se o pedido pedir |
| 10 | `application/persistence/dao/<modulo>-dao.interface.ts`, `application/persistence/repository/<modulo>-repository.interface.ts` e chaves em `src/core/di/token.ts` | `creating-persistence-ports` | `IXxxDao` só leitura. `IXxxRepository`: `save(Entity)`, `edit(Entity)`, `findById` → `Entity \| null`, `delete(id)`. Tokens `XxxDao` e `XxxRepository` |
| 11 | `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts` | `implementing-prisma-adapters` | `XxxDaoAdapterPrisma` e `XxxRepositoryAdapterPrisma`. `findById` ausente devolve `null`. Presente volta por `Factory.load` |
| 12 | `application/persistence/<modulo>-persistence.module.ts` | `creating-persistence-module` | `XxxPersistenceModule` com `TOKENS.XxxDao` e `TOKENS.XxxRepository` |
| 13 | pastas de use case | `creating-use-case` | Ver a tabela de use cases |
| 14 | `infra/drivers/http/admin/<modulo>-admin.controller.ts` e `infra/drivers/http/user/<modulo>-user.controller.ts` | `creating-controllers` | Ver a tabela de rotas |

Erro de invariante que não seja o `XxxNotFoundError` (factory inválida, transição ilegal) nasce no passo 3 ou 4, pela skill `creating-custom-errors`, quando a entidade ou a factory precisar dele. Não criar esse arquivo por antecipação.

Use cases mínimos. Classe sem sufixo `Service`.

| Pasta | Classe | Template | `execute` | Devolve |
|---|---|---|---|---|
| `create-<modulo>` | `CreateXxx` | comando rico | input e `createdBy` | `{ id }` |
| `edit-<modulo>` | `EditXxx` | comando rico | `id`, input e `actorId?`. Ausente ou dono errado lança `XxxNotFoundError` | `SuccessMessage` |
| `delete-<modulo>` | `DeleteXxx` | comando rico | `id` e `actorId?`. Carrega a entidade, checa dono, `repository.delete(id)`. Ausente ou dono errado lança `XxxNotFoundError` | `SuccessMessage` |
| `find-all-<modulo>` | `FindAllXxx` | query | query. DAO, sem instanciar entidade | `IPagination<XxxDto>` |
| `find-<modulo>-by-id` | `FindXxxById` | query | `id`. `null` da porta lança `XxxNotFoundError` | `XxxDto` |

Create, edit e transição de status falam com factory ou método da entidade e com `TOKENS.XxxRepository`. Find-all e find-by-id falam com `TOKENS.XxxDao`.

Comando de create extra: outra pasta `<verbo>-<modulo>`, outra classe, outro par de DTOs. Não inventar o segundo. Transição de status: pasta própria; carrega, chama o método, `repository.edit`. Comando interno: a mesma classe de use case, `void` ou o retorno que o pedido pedir, sem controller; registro ausente pode ser ignorado.

Rotas. Tag única do módulo em todos os métodos. `applyBadRequest` quando há body, query ou `Params`. `applyNotFound` em find-by-id, edit e delete. `applyUnprocessableEntity` quando a factory ou o método da entidade pode lançar 422. `createdResponse` no POST. `okPaginatedResponse` na lista. `okResponse` no resto.

| Superfície | HTTP | Caminho | Use case | Quem chama passa |
|---|---|---|---|---|
| Admin `admin/<plural>`, `@RequiredRoles(AccountRole.ADMIN)` | `POST` | `/` | `CreateXxx` | `user.sub` como `createdBy` |
| Admin | `GET` | `/` | `FindAllXxx` | query, sem `actorId` |
| Admin | `GET` | `:id` | `FindXxxById` | `id`, sem `actorId` |
| Admin | `PATCH` | `:id` | `EditXxx` | `id` e body, sem `actorId` |
| Admin | `DELETE` | `:id` | `DeleteXxx` | `id`, sem `actorId` |
| User `user/<plural>`, `@RequiredRoles(<papel>)` | `POST` | `/` | `CreateXxx` | `user.sub` como `createdBy` |
| User | `GET` | `/` | `FindAllXxx` | query, sem reescrever filtro |
| User | `GET` | `:id` | `FindXxxById` | `id`, sem `actorId` |
| User | `PATCH` | `:id` | `EditXxx` | `user.sub` como `actorId` |
| User | `DELETE` | `:id` | `DeleteXxx` | `user.sub` como `actorId` |

Rota de transição de status: só se o pedido pedir. O controller dessa rota segue a mesma regra de dono: admin omite `actorId`, user manda `user.sub`.

4. Escrever `src/app/<modulo>/<modulo>.module.ts` pelo template desta skill. `imports`: `XxxPersistenceModule` e `AuthenticationGuardsModule`. `controllers`: admin e user. `providers`: as cinco classes mínimas e, se o passo 3 criou, o comando extra e o comando interno. Sem `exports`.

5. Localizar `AppModule` (seção "Bloco base") e inserir `XxxModule` no array `imports`, mantendo os imports que já existem. Não registrar módulo de `_examples`.

6. Spec só aqui, não no meio da tabela. Na entidade, na factory, em cada use case, em cada controller, no DAO e no repository, ler `inventorying-test-scenarios`. Bug possível: parar e perguntar. Sem pendência: `writing-unit-tests` se o inventário tiver seção unitária (entidade, factory, use case e controller); `writing-integration-tests` se tiver seção de integração (use case, DAO e repository). DAO e repository sem spec unitário. Sem spec de DTO e sem spec de enum. Sem inventário, sem spec.

7. Checklist de entrega.

## Quando usar

| Sintoma | Ação |
|---|---|
| Estado inválido não pode existir | Seguir o fluxo e delegar cada arquivo |
| Pedido de módulo no estilo Tip, scaffold rico, ou esta skill pelo nome | Seguir o fluxo |

### Quando não usar

| Situação | Onde vai |
|---|---|
| Escolher entre anêmico, rico e interno | Skill `choosing-module-shape` |
| CRUD sem invariante que o objeto precise proteger | Skill `scaffolding-anemic-module` |
| Módulo só consumido por outro, sem HTTP | Skill `scaffolding-internal-module` |
| Um arquivo só (entidade, factory, enum, DTO, porta, adapter, use case, controller, model, erro) | Skill pontual da tabela do fluxo |

## Bloco base

Localizar pelos exports antes de escrever o módulo e de mexer no `AppModule`. Servem para reusar. Ausentes: parar e informar. Não há template de recriação — os dois são kernel e esta skill não os cria.

| Símbolo | Localizar por | Destino se ausente |
|---|---|---|
| `AppModule` | `export class AppModule` | Parar. Não criar outro `AppModule` |
| `AuthenticationGuardsModule` | `export class AuthenticationGuardsModule` | Parar. Não criar o módulo de guards |

```bash
grep -rn "export class AppModule" src
grep -rn "export class AuthenticationGuardsModule" src
```

No template, o import de `AuthenticationGuardsModule` usa o caminho do arquivo que o grep mostrou. O caminho conhecido deste template é `src/app/authentication/application/guards/guards.module`.

## Templates

Código do módulo Nest e do encaixe no `AppModule`. O resto dos arquivos nasce na skill da tabela do fluxo.

Substituir `<modulo>` pelo kebab singular e `Xxx` pelo PascalCase. Import de símbolo compartilhado: usar o caminho real do arquivo que exporta o símbolo (seção "Bloco base").

Módulo mínimo: admin, user e os cinco use cases. `AuthenticationGuardsModule` entra porque admin e user têm `@RequiredRoles`.

```ts
import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { XxxPersistenceModule } from 'src/app/<modulo>/application/persistence/<modulo>-persistence.module';
import { CreateXxx } from 'src/app/<modulo>/application/usecases/create-<modulo>/create-<modulo>.service';
import { DeleteXxx } from 'src/app/<modulo>/application/usecases/delete-<modulo>/delete-<modulo>.service';
import { EditXxx } from 'src/app/<modulo>/application/usecases/edit-<modulo>/edit-<modulo>.service';
import { FindAllXxx } from 'src/app/<modulo>/application/usecases/find-all-<modulo>/find-all-<modulo>.service';
import { FindXxxById } from 'src/app/<modulo>/application/usecases/find-<modulo>-by-id/find-<modulo>-by-id.service';
import { XxxAdminController } from 'src/app/<modulo>/infra/drivers/http/admin/<modulo>-admin.controller';
import { XxxUserController } from 'src/app/<modulo>/infra/drivers/http/user/<modulo>-user.controller';

@Module({
  imports: [
    XxxPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    XxxAdminController,
    XxxUserController,
  ],
  providers: [
    CreateXxx,
    DeleteXxx,
    EditXxx,
    FindAllXxx,
    FindXxxById,
  ],
})
export class XxxModule {}
```

Comando extra ou comando interno criado no passo 3: acrescentar o import e a classe em `providers`. Comando interno não entra em `controllers`.

Encaixe em `AppModule`. Manter os imports que já existem e acrescentar `XxxModule`.

```ts
import { XxxModule } from './app/<modulo>/<modulo>.module';

@Module({
  imports: [
    // cada import que já existe no arquivo permanece
    XxxModule,
  ],
})
export class AppModule {}
```

O bloco mostra a linha nova dentro do `AppModule` que já existe. O comentário marca os imports anteriores: eles permanecem no arquivo.

## Fora do escopo

| Artefato | Delegar a |
|---|---|
| Escolha da forma do módulo | Skill `choosing-module-shape` |
| Módulo anêmico | Skill `scaffolding-anemic-module` |
| Módulo interno sem HTTP | Skill `scaffolding-internal-module` |
| Value object | Skill `creating-value-objects` |
| Env | Skill `using-core-config` |
| Logger | Skill `using-logger` |
| Gateway de vendor (Redis, SMTP, S3, HTTP de terceiro) | Skill `using-ports-and-adapters` |
| Seed | Skill `writing-prisma-seed` |
| Cache de leitura | Skill `caching-a-read` |
| Collection Postman | Skill `syncing-postman-collection` |
| Spec de integração de use case, DAO ou repository Prisma | Skill `writing-integration-tests` |
| Teste e2e | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] O caso é estado inválido que o objeto protege; o papel do user veio do pedido
- [ ] Pasta kebab singular; URL `admin/<plural>` e `user/<plural>`; uma tag, sem canal
- [ ] Sem segundo create, enum, comando de lote ou papel inventado
- [ ] Cada arquivo da tabela do fluxo foi escrito pela skill citada, não por template copiado para cá
- [ ] `IXxxDao` só leitura; `IXxxRepository` com `save`, `edit`, `findById` e `delete`; tokens `XxxDao` e `XxxRepository`
- [ ] Adapters em `infra/driven/persistence/prisma/`, classes `XxxDaoAdapterPrisma` e `XxxRepositoryAdapterPrisma`
- [ ] Query não instancia entidade; `null` de find-by-id HTTP vira `XxxNotFoundError`
- [ ] Delete carrega a entidade e chama `repository.delete(id)`; não há método `remove()` no lugar do delete
- [ ] `actorId` só no edit e no delete do user; admin omite; create recebe `createdBy` nos dois canais
- [ ] Edição é `PATCH`; controller só chama `execute`, sem reescrever query
- [ ] `<modulo>.module.ts` com import absoluto `src/...`, os dois controllers, providers de todos os use cases criados, sem `exports`
- [ ] `AppModule` importa `XxxModule` e conserva os imports que já existiam
- [ ] `inventorying-test-scenarios` rodou na entidade, na factory, em cada use case, em cada controller, no DAO e no repository antes do spec; bug possível parou e perguntou; `writing-unit-tests` implementou só a seção unitária; `writing-integration-tests` só a de integração; DAO e repository sem spec unitário; sem spec de DTO ou de enum
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
