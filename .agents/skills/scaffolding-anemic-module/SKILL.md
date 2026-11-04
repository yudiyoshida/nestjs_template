---
name: scaffolding-anemic-module
description: Gera o módulo HTTP anêmico de CRUD na árvore canônica, sem entidade, factory ou repository, delegando cada arquivo à skill pontual. Use quando o usuário pedir para criar módulo anêmico, scaffold de CRUD sem invariante, módulo no estilo FAQ, ou scaffolding-anemic-module.
---

# Scaffold de módulo anêmico

Gera o módulo HTTP de CRUD sem invariante que o objeto precise proteger, na árvore canônica, delegando cada arquivo à skill pontual.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de módulo anêmico.** Todo o padrão — árvore, ordem, leis, contratos passados a cada skill, módulo Nest e import no `AppModule` — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra `src/app/_examples` nem skill vizinha para aprender seção, algoritmo ou template
- copie template de DTO, porta, adapter, use case, controller, model Prisma ou erro

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada (nome do módulo e colunas)
- arquivo que exporta `AppModule` ou `AuthenticationGuardsModule` — só para inserir ou reusar (seção "Bloco base")

A skill pontual citada em "Delegar a" é quem escreve o arquivo dela. Esta skill não reproduz o corpo desse arquivo. Abrir a skill pontual na hora de escrever aquele arquivo é executar a delegação, não aprender o formato desta orquestração.

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

### Leis

- Pasta do módulo em kebab, singular. URL em inglês no plural: `admin/<plural>` e `user/<plural>`. `faq` vira `faqs`. Proibido singular na URL (`admin/faq`).
- Tag Swagger: um texto só, o recurso no plural, igual em admin e user. Sem sufixo nem prefixo de canal.
- Sem entidade, sem factory, sem repository, sem enum.
- DAO em `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`. Classe `XxxDaoAdapterPrisma`. A porta `IXxxDao` faz leitura e escrita (`save`, `edit`, `delete`).
- Delete físico: `dao.delete(id)`. Sem soft delete.
- `findById` da porta devolve `null`. Use case exposto por HTTP lança `XxxNotFoundError` ao receber `null`. Edit e delete de HTTP também.
- Edição com campo opcional é `PATCH`.
- Lista com `Promise.all` de `findMany` e `count` pertence ao adapter. Aqui só se delega.
- Módulo com HTTP entra em `AppModule` na hora em que nasce.
- Import absoluto `src/...`. Proibido import relativo no `<modulo>.module.ts`.
- Classe do use case sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`.
- Create devolve `{ id }`. Edit e delete devolvem `SuccessMessage`.
- `:id` usa `Params`. Query de lista estende `Queries`. Proibido DTO novo de id, de paginação ou de mensagem.
- Lista: a porta devolve `[Dto[], number]`.
- Token `XxxDao` (`Symbol.for('XxxDao')`, nome sem `I`). Use case injeta `@Inject(TOKENS.XxxDao)`. Proibido importar a classe do adapter no use case.
- Controller sem `if` de negócio. Só chama `execute`. Documentação HTTP só pelo helper `Swagger`.
- Admin não recebe `actorId`.
- Colunas vêm do pedido. Proibido inventar campo de exemplo.

### Árvore

```
src/app/<modulo>/
  <modulo>.module.ts
  domain/errors/<modulo>-not-found.error.ts
  application/dtos/<modulo>.dto.ts
  application/persistence/<modulo>-persistence.module.ts
  application/persistence/dao/<modulo>-dao.interface.ts
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
  infra/drivers/http/admin/<modulo>-admin.controller.ts
  infra/drivers/http/user/<modulo>-user.controller.ts
prisma/schema/<modulo>.prisma
```

O controller user só entra na árvore quando o pedido pede endpoint user ou público. Também entram a chave `XxxDao` em `src/core/di/token.ts` e o import de `XxxModule` em `src/app.module.ts`.

Nomes com módulo `faq`: pasta `faq`, classes `FaqModule`, `CreateFaq`, `FindAllFaq`, `FindFaqById`, `EditFaq`, `DeleteFaq`, `IFaqDao`, `FaqDaoAdapterPrisma`, `FaqPersistenceModule`, `FaqNotFoundError`, `FaqDto`, `FaqAdminController`, `FaqUserController`. URL `admin/faqs`. Tag `FAQs`.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o caso anêmico
- [ ] 2. Fixar pasta, classes, plural da URL e tag
- [ ] 3. Delegar os arquivos na ordem da tabela
- [ ] 4. Escrever <modulo>.module.ts pelo template
- [ ] 5. Inserir XxxModule em AppModule
- [ ] 6. Inventariar cenários e delegar os specs
- [ ] 7. Checklist de entrega
```

1. Confirmar CRUD sem invariante que o objeto precise proteger. Estado inválido que o objeto precisa proteger: parar e nomear `scaffolding-rich-module`. Módulo sem HTTP: parar e nomear `scaffolding-internal-module`. Não criar arquivo.

2. Fixar a pasta kebab singular, o PascalCase `Xxx`, o plural inglês da URL e a tag única. Guardar as colunas do pedido para a delegação do model e dos DTOs.

3. Delegar na ordem abaixo. Cada linha é uma entrega da skill citada. Não escrever o corpo do arquivo nesta skill.

| Ordem | Arquivo | Delegar a | Contrato a passar |
|---|---|---|---|
| 1 | `prisma/schema/<modulo>.prisma` | `writing-prisma-model` | Colunas do pedido. Trilha e texto ficam com essa skill |
| 2 | `domain/errors/<modulo>-not-found.error.ts` | `creating-custom-errors` | Classe `XxxNotFoundError`, 404, mensagem `<Recurso> não encontrado na base de dados.` |
| 3 | `application/dtos/<modulo>.dto.ts` | `creating-application-dtos` | Read model plano, sem `class-validator` |
| 4 | `usecases/create-<modulo>/dtos/create-<modulo>.dto.ts` | `creating-application-dtos` | `CreateXxxInputDto` e, no mesmo arquivo, `CreateXxxOutputDto` com `{ id: string }` |
| 5 | `usecases/edit-<modulo>/dtos/edit-<modulo>.dto.ts` | `creating-application-dtos` | `EditXxxInputDto` com campos opcionais (`PATCH`) |
| 6 | `usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto.ts` | `creating-application-dtos` | `FindAllXxxQueryDto` estende `Queries`. Filtro extra só se o pedido pedir |
| 7 | `application/persistence/dao/<modulo>-dao.interface.ts` e chave em `src/core/di/token.ts` | `creating-persistence-ports` | `IXxxDao`: `findAll` → `[Dto[], number]`, `findById` → `Dto \| null`, `save(InputDto)` → `string`, `edit(id, InputDto)` → `void`, `delete(id)` → `void`. Token `XxxDao`. Sem `IXxxRepository` |
| 8 | `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` | `implementing-prisma-adapters` | Classe `XxxDaoAdapterPrisma`. Sem repository |
| 9 | `application/persistence/<modulo>-persistence.module.ts` | `creating-persistence-module` | `XxxPersistenceModule` só com `TOKENS.XxxDao` |
| 10 | cinco pastas de use case | `creating-use-case` | Template anêmico. Injeção `TOKENS.XxxDao`. Ver a tabela de use cases |
| 11 | `infra/drivers/http/admin/<modulo>-admin.controller.ts` | `creating-controllers` | Prefixo `admin/<plural>`. `@RequiredRoles(AccountRole.ADMIN)` na classe. Ver a tabela de rotas. Sem `actorId` |
| 12 | `infra/drivers/http/user/<modulo>-user.controller.ts` | `creating-controllers` | Só se o pedido pedir endpoint user ou público. Não criar controller vazio |

Use cases, uma pasta cada. Classe sem sufixo `Service`.

| Pasta | Classe | `execute` | Devolve |
|---|---|---|---|
| `create-<modulo>` | `CreateXxx` | input | `{ id }` |
| `find-all-<modulo>` | `FindAllXxx` | query | `IPagination<XxxDto>` |
| `find-<modulo>-by-id` | `FindXxxById` | `id`. `null` da porta lança `XxxNotFoundError` | `XxxDto` |
| `edit-<modulo>` | `EditXxx` | `id` e input. Ausente lança `XxxNotFoundError` | `SuccessMessage` |
| `delete-<modulo>` | `DeleteXxx` | `id`. Ausente lança `XxxNotFoundError`. Delete físico na porta | `SuccessMessage` |

Rotas do admin. Tag única do módulo em todos os métodos.

| HTTP | Caminho | Use case | Flags `Swagger` |
|---|---|---|---|
| `POST` | `/` | `CreateXxx` | `applyBadRequest`, `createdResponse` |
| `GET` | `/` | `FindAllXxx` | `applyBadRequest`, `okPaginatedResponse` |
| `GET` | `:id` | `FindXxxById` | `applyBadRequest`, `applyNotFound`, `okResponse` |
| `PATCH` | `:id` | `EditXxx` | `applyBadRequest`, `applyNotFound`, `okResponse` |
| `DELETE` | `:id` | `DeleteXxx` | `applyBadRequest`, `applyNotFound`, `okResponse` |

Superfície user. Só os endpoints que o pedido nomear. Lista pública: `GET` em `user/<plural>`, sem `@RequiredRoles`, mesma tag, mesmo `FindAllXxx`, flags `applyBadRequest` e `okPaginatedResponse`.

4. Escrever `src/app/<modulo>/<modulo>.module.ts` pelo template desta skill. `imports`: `XxxPersistenceModule` e, se algum controller tiver `RequiredRoles`, `AuthenticationGuardsModule`. `controllers`: os controllers criados no passo 3. `providers`: as cinco classes de use case. Sem `exports`.

5. Localizar `AppModule` (seção "Bloco base") e inserir `XxxModule` no array `imports`, mantendo os imports que já existem. Não registrar módulo de `_examples`.

6. Spec só aqui, não no meio da tabela. Em cada use case, em cada controller e no DAO, ler `inventorying-test-scenarios`. Bug possível: parar e perguntar. Sem pendência: `writing-unit-tests` se o inventário tiver seção unitária (use case e controller); `writing-integration-tests` se tiver seção de integração (use case e DAO). DAO sem spec unitário. Sem spec de DTO. Sem inventário, sem spec.

7. Checklist de entrega.

## Quando usar

| Sintoma | Ação |
|---|---|
| CRUD sem invariante que o objeto precise proteger | Seguir o fluxo e delegar cada arquivo |
| Pedido de módulo no estilo FAQ, scaffold anêmico, ou esta skill pelo nome | Seguir o fluxo |

### Quando não usar

| Situação | Onde vai |
|---|---|
| Escolher entre anêmico, rico e interno | Skill `choosing-module-shape` |
| Estado inválido não pode existir | Skill `scaffolding-rich-module` |
| Módulo só consumido por outro, sem HTTP | Skill `scaffolding-internal-module` |
| Um arquivo só (DTO, porta, adapter, use case, controller, model, erro) | Skill pontual da tabela do fluxo |

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

Módulo com admin e os cinco use cases. `AuthenticationGuardsModule` entra porque o admin tem `@RequiredRoles`.

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

@Module({
  imports: [
    XxxPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    XxxAdminController,
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

Quando o passo 3 criou controller user, acrescentar o import e a entrada em `controllers`. Não acrescentar provider novo: o user reusa o use case já listado.

```ts
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

Se nenhum controller tiver `RequiredRoles`, omitir `AuthenticationGuardsModule` dos imports e do array `imports`.

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
| Módulo rico (entidade, factory, repository) | Skill `scaffolding-rich-module` |
| Módulo interno sem HTTP | Skill `scaffolding-internal-module` |
| Entidade | Skill `creating-domain-entity` |
| Factory | Skill `creating-domain-factory` |
| Enum | Skill `creating-domain-enum` |
| Value object | Skill `creating-value-objects` |
| Erro que não seja o `XxxNotFoundError` deste fluxo | Skill `creating-custom-errors` |
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

- [ ] O caso é CRUD sem invariante; não nasceu entidade, factory, repository nem enum
- [ ] Pasta kebab singular; URL `admin/<plural>` (e `user/<plural>` só se houver controller user); uma tag, sem canal
- [ ] Cada arquivo da tabela do fluxo foi escrito pela skill citada, não por template copiado para cá
- [ ] `IXxxDao` concentra leitura e `save` / `edit` / `delete`; token `XxxDao`; sem `IXxxRepository`
- [ ] Adapter em `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`, classe `XxxDaoAdapterPrisma`
- [ ] Cinco use cases anêmicos, `execute`, create devolve `{ id }`, edit e delete devolvem `SuccessMessage`, `null` vira `XxxNotFoundError`
- [ ] Admin com `RequiredRoles(AccountRole.ADMIN)`, `PATCH` na edição, sem `actorId`; user só se o pedido pediu, sem controller vazio
- [ ] `<modulo>.module.ts` com import absoluto `src/...`, providers dos cinco use cases, sem `exports`
- [ ] `AppModule` importa `XxxModule` e conserva os imports que já existiam
- [ ] `inventorying-test-scenarios` rodou em cada use case, em cada controller e no DAO antes do spec; bug possível parou e perguntou; `writing-unit-tests` implementou só a seção unitária; `writing-integration-tests` só a de integração; DAO sem spec unitário; sem spec de DTO
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
