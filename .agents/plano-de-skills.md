# Plano de skills do template Nest

Briefing para uma janela de contexto nova criar **uma** skill por vez. Decisões de produto e catálogo estão aqui. O formato do `SKILL.md` não está aqui.

Pasta das skills: `.agents/skills/<kebab>/SKILL.md`.

`_examples` some depois que as skills existirem e uma prova gerar um módulo só com elas. Até lá, `_examples` é matéria-prima para copiar comportamento para dentro da skill. Drift listado abaixo não entra no template.

## Quem lê este arquivo

Janela nova. Usuário nomeia **uma** skill da seção "Ordem das janelas".

1. Ler este arquivo.
2. Ler `.agents/skills/creating-project-skills/SKILL.md` e seguir o molde (fonte da verdade do formato, autocontenção, teto de 500 linhas, `references/`, checklist).
3. Ler só os arquivos de `src/` citados na skill desta janela, para extrair comportamento e reescrever o template **canônico** dentro da pasta da skill.
4. Aplicar a tabela de congelamento quando o arquivo de exemplo divergir.
5. Escrever a skill. Na tabela de status do catálogo, trocar `pendente` por `criada`.
6. Parar. Não começar a próxima skill nesta janela.

Proibido nesta janela:

- Abrir outra skill para copiar seções ou formato. Skills de domínio já existentes só entram na tabela "Delegar a" pelo nome.
- Criar mais de uma skill.
- Alterar código de `src/`, Prisma ou `_examples` para "corrigir o drift". A skill ensina o canônico. O exemplo velho fica até `_examples` ser apagado.
- Inventar skill para item da seção "Fora desta leva".

## Objetivo

Toda geração de código por IA segue receita fechada: sem Nest genérico, sem Prisma no use case, sem regra no controller, sem `@Roles()` inventado, sem um controller único, sem repository para leitura.

Cada skill é autocontida. O código que ela manda recriar mora em `SKILL.md` ou `references/` da própria pasta. Caminho de destino (`src/...`) pode aparecer. Frase "veja `src/...`" ou "copie o arquivo do projeto" não pode.

## Skills que já existem

Não recriar. Skill nova delega.

| Pasta | Status | Cobre |
|---|---|---|
| `creating-project-skills` | criada | Molde de skill. Não é skill de domínio Nest |
| `creating-value-objects` | criada | VO imutável em `src/shared/value-objects` ou `domain/value-objects` |
| `creating-custom-errors` | criada | Classe que estende `AppException`. Global em `src/shared/errors`. Módulo em `domain/errors` ou `application/errors`. Erro de VO ao lado do VO |
| `using-core-config` | criada | Env só via `ConfigService`. Proibido `process.env` em código novo de aplicação |
| `using-logger` | criada | `ILoggerGateway` + `LogContext` na fronteira (adapter real, filter). Sem log em entidade, VO, factory, controller, happy path de use case |
| `using-ports-and-adapters` | criada | Port de vendor em `src/infra`: `IXxxGateway`, adapter real, fake, ACL, `XxxModule.register()`, token. Cache, SMTP, S3, CEP, CNPJ, logger de arquivo |
| `writing-unit-tests` | criada | `*.spec.ts` Jest, AAA, happy / error / edge. Spec é obrigatório em toda entrega de código que a skill nova gerar, delegando aqui |

Nomes já reservados nessas skills e usados neste plano: `creating-controllers`, `creating-persistence-adapters` (aqui partido em portas + module + adapters), `writing-integration-tests`, `writing-e2e-tests`, `using-error-tracking`, `auditing-with-interceptors`. Os quatro últimos estão em "Fora desta leva".

## Processo de cada janela

Prompt que o usuário cola:

```
Leia .agents/plano-de-skills.md e .agents/skills/creating-project-skills/SKILL.md.
Crie somente a skill <kebab> descrita no plano.
Formato do SKILL.md: só creating-project-skills.
Decisões de comportamento: só a tabela de congelamento do plano.
Não abra skill vizinha para copiar formato.
Não altere src/ nem _examples.
Ao terminar, na tabela de status do catálogo, troque `pendente` por `criada`.
```

Dentro da skill nova, repetir as linhas da tabela de congelamento que ela aplica. A próxima janela não lê a skill anterior. O canônico tem que estar no texto dela.

`SKILL.md` com menos de 500 linhas. Template longo vai para `references/<assunto>.md`. No passo do fluxo que escreve aquele bloco: "leia `references/<assunto>.md` antes de escrever X". Referência acima de ~300 linhas ganha índice no topo.

Texto em português. `name` do frontmatter igual ao nome da pasta. `description`: o que a skill faz, depois "Use quando…". Sem resumir o fluxo interno na description.

## Congelamento

Lei. O template da skill escreve isto. Arquivo de exemplo que diverge é drift e não entra no template.

| Decisão | Lei |
|---|---|
| Adapter Prisma | `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts` |
| Classe do adapter | `XxxDaoAdapterPrisma`, `XxxRepositoryAdapterPrisma` |
| Enum TS | Valor `SCREAMING_SNAKE` (`ACTIVE`, `ADMIN`) |
| Coluna do enum | `String` no Prisma. Sem enum nativo do Prisma |
| Tabela em vez de enum | Só quando o registro tem coluna própria ou relação (`Role`, `Admin`) |
| Edição | Body com campos opcionais → `PATCH`. Body que substitui o recurso inteiro → `PUT`. "Editar" no estilo FAQ/Tip (campo opcional) é `PATCH` |
| Lista + count | `Promise.all` de `findMany` e `count` |
| `findById` | Porta devolve `null`. Use case exposto por HTTP lança erro `NotFound` quando recebe `null` |
| Delete | Físico. Rico: `repository.delete(id)`. Anêmico: `dao.delete(id)`. Sem soft delete na receita |
| Status | Anêmico: DAO atualiza a coluna. Rico: só método da entidade; use case carrega, chama o método, `repository.edit`. Delete não é transição de status |
| Dono | `actorId?` no `execute`. Admin omite. User manda `user.sub`. Dono errado lança o mesmo `NotFound` do recurso ausente |
| Segredo | Select padrão sem senha, token ou documento. Leitura sensível tem método próprio e DTO `WithSensitiveData` |
| Factory inválida | Classe de erro de domínio. Skill `creating-custom-errors` cria o arquivo do erro. Proibido `new AppException('texto')` |
| Módulo com HTTP | Import em `AppModule` na hora em que nasce |
| Módulo sem HTTP | Importado só pelo módulo que consome. `exports` levam os use cases. Fora do `AppModule` |
| URL de CRUD | Plural em inglês da pasta do módulo: `admin/faqs`, `user/tips`. Módulo `authentication` já existe; rotas `auth/...` não seguem essa regra e não são recriadas |
| Tag Swagger | Uma tag por módulo, nome do recurso no plural, o mesmo texto em admin e user. Sem prefixo de canal (`Portal Gerencial`, `Aplicativo`, `Público`) |

### Regras que FAQ e Tip já compartilham

- Import absoluto `src/...`.
- Classe do use case sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`. Exemplo: classe `CreateFaq` em `create-faq.service.ts`.
- Controller não tem `if` de negócio. Só chama `execute`.
- Um filter global já existe (`APP_FILTER` = `HttpExceptionFilter` para `AppException`). Código novo lança subclasse de `AppException`. Sem segundo filter. Sem `HttpException` do Nest no domínio.
- Create devolve `{ id }` (`*OutputDto`). Update e delete devolvem `SuccessMessage` de `src/core/dtos/success-message.dto.ts`. Proibido criar outro DTO de mensagem.
- `:id` da rota usa `Params` de `src/infra/validators/class/dtos/params/params.dto.ts`. Proibido DTO novo de id.
- Query de lista estende `Queries` de `src/infra/validators/class/dtos/queries/queries.dto.ts`. `page`, `size` e `search` não se reescrevem.
- Lista: DAO devolve `[Dto[], number]`. Use case faz `new Pagination(items, total, page, size).getDto()`. DAO usa `this.prisma.paginationFactory(page, size)`.
- Token em `src/core/di/token.ts`: `Symbol.for('XxxDao')` / `Symbol.for('XxxRepository')`, nome sem `I`.
- Use case injeta a porta com `@Inject(TOKENS.XxxDao)`. Nunca importa a classe do adapter.
- Documentação HTTP só pelo helper `Swagger` de `src/infra/openapi/swagger.ts`. Sem `@ApiOkResponse` / `@ApiTags` soltos no controller.

### Drift — ler para extrair forma, não copiar o trecho

| Arquivo | O que ignorar | No lugar |
|---|---|---|
| `src/app/_examples/faq/infra/driven/persistence/faq.dao.ts` | Pasta solta, sem `prisma/` | Caminho canônico da tabela |
| `src/app/_examples/faq/infra/driven/persistence/faq.dao.ts` | `prisma.$transaction` | `Promise.all` |
| `src/app/_examples/tip/infra/driven/persistence/prisma/tip-prisma.dao.ts` | `Promise.all` | Este arquivo é o canônico da lista |
| `src/app/account/infra/driven/persistence/prisma/account-prisma.dao.ts` | Classe `AccountPrismaAdapterDao` | `XxxDaoAdapterPrisma`. O select duplo (público vs `WithSensitiveData`) é o canônico de segredo |
| `src/app/_examples/tip/domain/enums/tip-status.enum.ts` | Valor `'Active'` | `SCREAMING_SNAKE` |
| `src/app/account/domain/enums/account-status.enum.ts` | Valor `'Ativo'` | `SCREAMING_SNAKE`. Forma do `enum` string pode ser lida em `account-role.enum.ts` |
| `src/app/account/domain/enums/account-role.enum.ts` | — | Canônico de valor de enum (`ADMIN`) |
| `src/app/_examples/tip/infra/drivers/http/admin/tip-admin.controller.ts` | `@Put` com body parcial | `PATCH` |
| `src/app/_examples/tip/application/usecases/find-tip-by-id/find-tip-by-id.service.ts` | Devolve `null` | Use case de HTTP lança `NotFound` |
| `src/app/_examples/tip/domain/factories/tip.factory.ts` | `new AppException('texto')` | Classe de erro |
| `src/app/_examples/tip/domain/entities/tip.entity.ts` | `remove()` não é o delete | Delete físico fica na porta. Método de status no molde é `expire()` |
| `src/app/_examples/faq/application/persistence/faq-persistence.module.ts` | Comentário tutorial | Estrutura igual a `tip-persistence.module.ts`, sem comentário |
| `src/app.module.ts` | FAQ e Tip fora do `imports` | Módulo novo **com HTTP** entra em `AppModule`. Exemplo fica de fora porque é exemplo |
| Controllers de Tip | URL `tips` no plural | Plural é a lei. FAQ em `faq` singular é o drift |
| `faq-admin.controller.ts` / `faq-user.controller.ts` | Tags `FAQs` e `FAQs - Público` | Uma tag só, sem sufixo de canal |
| `tip-*-controller.ts` | Tags `Portal Gerencial - Dicas` e `Aplicativo - Dicas` | Uma tag só, sem prefixo de canal |

## Árvores canônicas

Nome da pasta do módulo em kebab, singular (`faq`, `tip`). URL em inglês no plural.

### Módulo anêmico (FAQ)

CRUD sem invariante que o objeto precise proteger. Sem entidade, sem factory, sem repository. DAO faz leitura e escrita com DTO.

```
src/app/<modulo>/
  <modulo>.module.ts
  domain/errors/<modulo>-not-found.error.ts
  application/dtos/<modulo>.dto.ts
  application/persistence/<modulo>-persistence.module.ts
  application/persistence/dao/<modulo>-dao.interface.ts
  application/usecases/<verbo>-<modulo>/
    <verbo>-<modulo>.service.ts
    dtos/                         # input, output ou query, quando houver
  infra/driven/persistence/prisma/<modulo>-prisma.dao.ts
  infra/drivers/http/admin/<modulo>-admin.controller.ts
  infra/drivers/http/user/<modulo>-user.controller.ts
prisma/schema/<modulo>.prisma
```

Também mexe em `src/core/di/token.ts` (chave `XxxDao`) e `src/app.module.ts` (import).

Use cases mínimos de CRUD, uma pasta cada: `create`, `find-all`, `find-by-id`, `edit`, `delete`. User controller só leva os endpoints que o pedido pedir. FAQ user é só `GET` público, sem `RequiredRoles`.

### Módulo rico (Tip)

Estado inválido não pode existir. Entidade + factory + enum. Duas portas.

```
src/app/<modulo>/
  <modulo>.module.ts
  domain/entities/<modulo>.entity.ts
  domain/enums/
  domain/errors/
  domain/factories/<modulo>.factory.ts
  application/dtos/<modulo>.dto.ts
  application/persistence/<modulo>-persistence.module.ts
  application/persistence/dao/<modulo>-dao.interface.ts
  application/persistence/repository/<modulo>-repository.interface.ts
  application/usecases/<verbo>-<modulo>/
  infra/driven/persistence/prisma/<modulo>-prisma.dao.ts
  infra/driven/persistence/prisma/<modulo>-prisma.repository.ts
  infra/drivers/http/admin/<modulo>-admin.controller.ts
  infra/drivers/http/user/<modulo>-user.controller.ts
prisma/schema/<modulo>.prisma
```

Token: `XxxDao` e `XxxRepository`. Import em `AppModule`.

- Comando (`create`, `edit`, transição de status): factory ou método da entidade + repository.
- Query (`findAll`, `findById` de HTTP): DAO, devolve DTO, não instancia entidade.
- Comando interno sem HTTP (expirar em lote): mesma classe de use case, sem controller.
- Delete: `repository.delete(id)` depois de achar a entidade (para `NotFound` e checagem de dono). Não chama método `remove()`.

### Módulo interno (Account)

Sem controller. Quem usa importa o módulo.

```
src/app/<modulo>/
  <modulo>.module.ts          # exports dos use cases
  domain/enums/
  domain/value-objects/       # quando o conceito for do módulo; skill creating-value-objects
  application/dtos/
  application/persistence/
  application/usecases/
  infra/driven/persistence/prisma/
```

Fora de `AppModule`. O consumidor (hoje `AuthenticationModule` importa `AccountModule`) importa e recebe os use cases pelo export. Persistência anêmica quando não há agregado.

## Catálogo

Orquestradora lista arquivos e delega. Template do arquivo mora na skill pontual. Na orquestradora, "delegar a" cita o nome. Não copia o template.

Status só tem dois valores: `pendente` e `criada`. A janela que termina a skill troca a célula para `criada` quando `.agents/skills/<kebab>/SKILL.md` existe e o checklist de `creating-project-skills` passou. Nenhum outro valor.

| # | Skill | Status |
|---|---|---|
| 1 | `choosing-module-shape` | criada |
| 2 | `scaffolding-anemic-module` | criada |
| 3 | `scaffolding-rich-module` | criada |
| 4 | `scaffolding-internal-module` | criada |
| 5 | `creating-domain-entity` | criada |
| 6 | `creating-domain-factory` | criada |
| 7 | `creating-domain-enum` | criada |
| 8 | `creating-use-case` | criada |
| 9 | `creating-application-dtos` | criada |
| 10 | `creating-persistence-ports` | criada |
| 11 | `creating-persistence-module` | criada |
| 12 | `writing-prisma-model` | criada |
| 13 | `implementing-prisma-adapters` | criada |
| 14 | `creating-controllers` | criada |
| 15 | `creating-class-validator-decorator` | criada |
| 16 | `writing-prisma-seed` | criada |
| 17 | `caching-a-read` | criada |
| 18 | `syncing-postman-collection` | criada |

### 1. `choosing-module-shape`

Porta de entrada. Pedido "cria módulo / CRUD / regra" passa aqui antes de arquivo.

| Sintoma | Caminho |
|---|---|
| CRUD sem invariante que o objeto precise proteger | `scaffolding-anemic-module` |
| Estado inválido não pode existir | `scaffolding-rich-module` |
| Módulo só consumido por outro, sem HTTP | `scaffolding-internal-module` |
| Redis, SMTP, S3, HTTP de terceiro | `using-ports-and-adapters` |
| Formato reutilizável (CPF, e-mail, data) | `creating-value-objects` |
| Falha de regra | `creating-custom-errors` |

Trava o lugar: `src/app/<modulo>/{domain,application,infra}`, `src/shared` só cross-módulo, `src/infra` só vendor, `src/core` só kernel. Proíbe Prisma no use case, `process.env` em código de aplicação, `HttpException` do Nest no domínio, `if` de negócio no controller.

Escreve por último, quando os nomes das outras skills já existem. Não cria arquivo de `src/`.

### 2. `scaffolding-anemic-module`

Receita FAQ inteira, na árvore anêmica canônica. Cada arquivo delega à skill pontual. Último passo: `writing-unit-tests` em use case, DAO e controller.

Fonte para montar a lista de arquivos (não para copiar drift): `src/app/_examples/faq/`.

### 3. `scaffolding-rich-module`

Receita Tip inteira, na árvore rica canônica. Admin com `RequiredRoles(AccountRole.ADMIN)`. User logado com `RequiredRoles(<papel>)` e `user.sub` nas mutações de dono. Dono só no use case.

Fonte: `src/app/_examples/tip/`.

### 4. `scaffolding-internal-module`

Receita Account. Sem controller. `providers` e `exports` são os use cases. Persistência delega às skills de porta, module e adapter.

Fonte: `src/app/account/`, `src/app/authentication/authentication.module.ts` (só o import de `AccountModule`).

### 5. `creating-domain-entity`

Construtor privado. `static _instantiate`. `props` devolve cópia. Mutação só por método que protege invariante e lança erro de domínio. Sem Prisma, sem Nest, sem gerar UUID (UUID é factory). Molde de método de status: `expire()`. Delete físico não vira método da entidade.

Fonte: `src/app/_examples/tip/domain/entities/tip.entity.ts`.

Erro lançado pelo método: delegar `creating-custom-errors`.

### 6. `creating-domain-factory`

Único lugar que chama `_instantiate`. `create*` valida, gera `UUID`, define estado inicial. `load` reidrata sem revalidar regra de criação. `edit` faz merge e revalida. Data via `UTCDate` (`src/shared/value-objects/utc-date/utc-date.vo.ts`). Falha de validação: classe de erro, não `new AppException('texto')`.

Fonte de forma: `src/app/_examples/tip/domain/factories/tip.factory.ts`. Trocar os `AppException` soltos por classe de erro no template.

### 7. `creating-domain-enum`

Arquivo `domain/enums/<nome>.enum.ts`. `export enum` com valor explícito `SCREAMING_SNAKE`. Prisma guarda `String`. Sem `enum` nativo do Prisma para status ou tipo simples.

Fonte: `src/app/account/domain/enums/account-role.enum.ts`. Não usar os valores de `account-status.enum.ts` nem de `tip-status.enum.ts`.

### 8. `creating-use-case`

Quatro templates. Se passar de 500 linhas, `references/` por template.

| Template | Injeção | Fala com | Devolve |
|---|---|---|---|
| Anêmico | `TOKENS.XxxDao` | DTO | `{ id }`, `SuccessMessage`, DTO ou `IPagination<Dto>` |
| Comando rico | `TOKENS.XxxRepository` | Entidade e factory | `{ id }` ou `SuccessMessage` |
| Query | `TOKENS.XxxDao` | DTO | DTO ou `IPagination<Dto>` |
| Comando interno sem HTTP | DAO e/ou repository | Entidade no rico | `void` ou o que o pedido pedir. Sem controller |

`findById` de HTTP: porta `null` → lança `NotFound`. Edit e delete de HTTP também. Comando interno pode ignorar registro ausente (ver `expire-tips`).

Dono: parâmetro `actorId?: string`. Se veio e `createdBy !== actorId`, lança o `NotFound` do recurso. Admin não passa o argumento.

Fontes:

- Anêmico: `src/app/_examples/faq/application/usecases/create-faq/create-faq.service.ts`, `edit-faq.service.ts`, `delete-faq.service.ts`, `find-faq-by-id.service.ts`, `find-all-faq.service.ts`
- Comando rico: `src/app/_examples/tip/application/usecases/create-local-tip/create-local-tip.service.ts`, `edit-tip.service.ts`, `delete-tip.service.ts`
- Query rica: `find-all-tip.service.ts`. `find-tip-by-id.service.ts` só como contraste: o template lança `NotFound`, igual `find-faq-by-id`
- Interno: `expire-tips.service.ts`

### 9. `creating-application-dtos`

Quatro formatos.

| Peça | Onde | Regra |
|---|---|---|
| `*InputDto` | `usecases/<acao>/dtos/` | `class-validator` + `@ApiProperty({ example })` + `@Trim()`. Mensagem em português com `$property` |
| `*OutputDto` de create | mesmo arquivo do input, quando o exemplo faz assim | `{ id: string }`, sem validator |
| `*QueryDto` | `usecases/find-all-.../dtos/` | `extends Queries`. Filtro extra `@IsOptional`. Enum de filtro com `@IsEnum` |
| Read model | `application/dtos/<nome>.dto.ts` | Classe plana. Sem `class-validator` |

`PATCH`: campos opcionais (`@IsOptional`, `@ApiPropertyOptional`). `PUT`: campos obrigatórios, body substitui o recurso. Proibido recriar `Queries`, `Params` e `SuccessMessage`.

Fontes: `create-faq.dto.ts`, `faq.dto.ts`, `find-all-faq.dto.ts` (estende `Queries` vazio), `find-all-tip-query.dto.ts` (filtros), `edit-tip.dto.ts` (parcial — no controller isso vira `PATCH`), `src/infra/validators/class/dtos/queries/queries.dto.ts`, `src/core/dtos/success-message.dto.ts`.

### 10. `creating-persistence-ports`

| Porta | Caminho | Contrato |
|---|---|---|
| `IXxxDao` | `application/persistence/dao/<modulo>-dao.interface.ts` | Leitura devolve `Dto` ou `[Dto[], number]`. No anêmico, a mesma porta tem `save` / `edit` / `delete` recebendo InputDto |
| `IXxxRepository` | `application/persistence/repository/<modulo>-repository.interface.ts` | `save` e `edit` recebem a entidade. `findById` devolve `Entity \| null`. `delete(id)` |

Token na mesma entrega, em `src/core/di/token.ts`.

Fontes: `faq-dao.interface.ts` (DAO anêmico com escrita), `tip-dao.interface.ts` (DAO só leitura), `tip-repository.interface.ts`, `src/core/di/token.ts`.

### 11. `creating-persistence-module`

`XxxPersistenceModule`. Importa `DatabaseModule`. `provide: TOKENS.XxxDao` / `XxxRepository`, `useClass` no adapter Prisma, `exports` dos mesmos providers.

Fonte de forma: `src/app/_examples/tip/application/persistence/tip-persistence.module.ts`. Sem os comentários de `faq-persistence.module.ts`.

### 12. `writing-prisma-model`

Um arquivo `prisma/schema/<modelo>.prisma`. `prisma/schema/schema.prisma` fica só com `generator` e `datasource`. `package.json` → `prisma.schema` = `prisma/schema`. Não mover model para `schema.prisma`.

Campos de trilha: `id String @id @default(uuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`. Texto longo `@db.Text`. Título `@db.VarChar(n)`. Enum de domínio = `String`. Tabela com colunas próprias segue `account.prisma` (`Account`, `Role`, `Admin`) só quando a decisão "tabela em vez de enum" mandar.

Fontes: `prisma/schema/schema.prisma`, `faq.prisma`, `tip.prisma`, `account.prisma`.

### 13. `implementing-prisma-adapters`

Dois templates. Classe `XxxDaoAdapterPrisma` e `XxxRepositoryAdapterPrisma`. Pasta canônica `infra/driven/persistence/prisma/`.

DAO:

- `const XxxSelect = { ... } satisfies Prisma.XxxSelect`
- `paginationFactory`
- `where` com `contains` + `mode: 'insensitive'` na busca
- `orderBy: { createdAt: 'desc' }`
- `Promise.all` de `findMany` e `count`
- `mapToDto` quando há cast de enum
- Select padrão sem senha, token, documento
- Leitura sensível: segundo select e DTO `WithSensitiveData`, método explícito

Repository:

- Colunas explícitas a partir de `entity.props`. Sem spread cego do objeto
- `findById` ausente devolve `null`
- Presente volta por `Factory.load`
- Sem regra de negócio no adapter

Fontes: `tip-prisma.dao.ts` (lista com `Promise.all`), `tip-prisma.repository.ts` (mapa e `load`), `account-prisma.dao.ts` (select sensível; renomear a classe no template).

### 14. `creating-controllers`

Nome da pasta: `creating-controllers`.

| Superfície | Prefixo | Auth | `execute` recebe |
|---|---|---|---|
| Gestão | `admin/<plural>` | `@RequiredRoles(AccountRole.ADMIN)` na classe | sem `actorId` |
| Conta logada | `user/<plural>` | `@RequiredRoles(<papel>)` | `user.sub` nas mutações de dono |
| Leitura anônima | `user/<plural>` | sem guard | só query |
| Login / refresh | `auth/login`, `auth/refresh` | sem guard. `@HttpCode(HttpStatus.OK)` no POST que não cria | body |
| Logout | `auth/logout` | `@RequiredRoles()` vazio | `user.sub` |

Login, refresh e logout são referência da matriz. A skill não recria o módulo `authentication`.

Flags do `Swagger`:

| Flag | Quando |
|---|---|
| `applyBadRequest` | body ou query validado |
| `applyNotFound` | use case lança not found |
| `applyForbidden` | endpoint pode lançar forbidden de conta |
| `applyUnprocessableEntity` | erro de domínio com 422 |
| `createdResponse` | POST que cria |
| `okPaginatedResponse` | lista |
| `okResponse` | resto |
| `applyConflict` / `applyUnsupportedMediaType` | só quando o use case realmente produz esse status |

Usuário autenticado: `@User() user: Payload`. `Payload` tem `sub` e `roles` (`src/app/authentication/domain/types/payload.type.ts`).

Fontes: `faq-admin.controller.ts`, `faq-user.controller.ts` (público), `tip-user.controller.ts` (papel + dono), `authentication.controller.ts` (matriz auth), `required-role.decorator.ts`, `user.decorator.ts`, `src/infra/openapi/swagger.ts`. Decorators e helper já existem: a skill manda usar, não recriar.

### 15. `creating-class-validator-decorator`

Só quando dois DTOs ou mais precisam do mesmo `Transform`. Pasta `src/infra/validators/class/decorators/<nome>/<nome>.ts`. Validator de um campo só fica no DTO.

Fontes: `src/infra/validators/class/decorators/trim/trim.ts`, `string-number/string-number.ts`.

### 16. `writing-prisma-seed`

Classe com `static seed(prisma: PrismaClient)`. Registro em `prisma/seeds/index.ts`. Fora do Nest: sem `ConfigService`, sem módulo. Comando existente: `npm run db:seed` (`package.json` → `prisma.seed`). Segredo não entra no arquivo commitado; o template lê dado que o pedido informar na hora, no mesmo estilo de `prisma/seeds/admin.ts` (ler esse arquivo e não gravar senha nova no exemplo da skill se o seed atual tiver segredo — descrever o contrato, não copiar credencial).

### 17. `caching-a-read`

Cache-aside: `CacheKeyBuilder` → `cacheGateway.get` → use case → `cacheGateway.set` com TTL. Recurso novo entra na union `Resource` de `src/infra/cache/helpers/cache-key/cache-key.builder.ts`. Chave em string solta fica proibida. Gateway em si: `using-ports-and-adapters`. Esta skill é o uso do cache e a extensão da union.

Fonte: `src/app/authentication/application/guards/authentication/authentication.guard.ts` (método `getAccount`), `cache-key.builder.ts`.

### 18. `syncing-postman-collection`

Collection não se edita à mão. Comando: `npm run generate:postman` (`postman/swagger-to-postman.ts`). Entrada: `postman/swagger.json` (ou `SWAGGER_PATH`). Saída: `postman/api.postman_collection.json`. A skill trava o comando e proíbe editar o JSON gerado. Não inventa outro gerador.

Fontes: `postman/swagger-to-postman.ts`, `postman/README.md`, script `generate:postman` no `package.json`.

## Ordem das janelas

Uma skill por janela. 15–18 podem acontecer em paralelo com as pontuais, em chats separados, porque não dependem do módulo. Orquestradora espera as pontuais que ela cita. `choosing-module-shape` por último.

1. `creating-domain-entity`
2. `creating-domain-factory`
3. `creating-domain-enum`
4. `creating-use-case`
5. `creating-application-dtos`
6. `creating-persistence-ports`
7. `creating-persistence-module`
8. `writing-prisma-model`
9. `implementing-prisma-adapters`
10. `creating-controllers`
11. `scaffolding-anemic-module`
12. `scaffolding-rich-module`
13. `scaffolding-internal-module`
14. `choosing-module-shape`
15. `creating-class-validator-decorator` (qualquer momento)
16. `writing-prisma-seed` (qualquer momento)
17. `caching-a-read` (qualquer momento)
18. `syncing-postman-collection` (qualquer momento)

Status mora na tabela do catálogo. Esta lista só define a ordem.

## Fora desta leva

Sem implementação no repositório. Skill aqui alucinaria a receita. Também estão em `todo.md`.

- Filas BullMQ. `ExpireTips` já é o use case interno. O transporte da fila não existe.
- JWT em cookie httpOnly.
- Autorização CASL/claims. Hoje é `RequiredRoles` + `AuthorizationGuard`.
- Auditoria por interceptor (`auditing-with-interceptors`).
- Sentry / `using-error-tracking`.
- Teste de integração e e2e (`writing-integration-tests`, `writing-e2e-tests`). Não há `*.integration.spec.ts` nem e2e no repo.
- Gateway WebSocket. Existem `websocket.strategy.ts` e `websocket.guard.ts`. Não existe gateway consumidor. Não inventar a forma do gateway.
- Forgot/reset password. Só comentário em `authentication.controller.ts`.
- Segundo exception filter, pipe global novo, interceptor novo.

## Prova antes de apagar `_examples`

Com as skills 1–14 prontas:

1. Janela nova, sem ler `_examples`.
2. Pedir um módulo fictício anêmico e outro rico, passando por `choosing-module-shape`.
3. Comparar a árvore e os contratos com este plano (URL plural, `Promise.all`, `PATCH` parcial, `NotFound`, adapter em `prisma/`, token, `AppModule`).
4. Só então apagar `src/app/_examples`.

Apagar `_examples` não é parte da criação de uma skill.
