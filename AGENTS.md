# Template Nest: leis para agentes

Valem para código novo e para mudança em código que já existe. Toda geração de código segue receita fechada: sem Nest genérico, sem Prisma no use case, sem regra no controller, sem `@Roles()` inventado, sem um controller único, sem repository para leitura.

- Código novo começa pela skill `create-new-feature`, que nomeia a skill de cada peça.
- Skills moram em `.agents/skills/<kebab>/SKILL.md`. Skill nova ganha symlink em `.claude/skills/` e em `.cursor/skills/` apontando para `../../.agents/skills/<kebab>`.
- O formato de cada arquivo mora na skill da peça. Aqui ficam só as decisões que valem para todas.
- Código existente que diverge destas leis é drift: não copiar o trecho.

## Lugar e proibições

- Módulo de aplicação: `src/app/<modulo>/{domain,application,infra}`. Pasta do módulo em kebab, singular.
- `src/shared` só para conceito cross-módulo. `src/infra` só para vendor. `src/core` só para kernel.
- Proibido: Prisma no use case, `process.env` em código de aplicação, `HttpException` do Nest no domínio, `if` de negócio no controller.

## Congelamento

| Decisão | Lei |
|---|---|
| Adapter Prisma | `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts` |
| Classe do adapter | `XxxDaoAdapterPrisma`, `XxxRepositoryAdapterPrisma` |
| Enum TS | Valor `SCREAMING_SNAKE` (`ACTIVE`, `ADMIN`) |
| Coluna do enum | `String` no Prisma. Sem enum nativo do Prisma |
| Tabela em vez de enum | Só quando o registro tem coluna própria ou relação (`Role`, `Admin`) |
| Edição | Body com campos opcionais → `PATCH`. Body que substitui o recurso inteiro → `PUT` |
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
| Dinheiro | Centavos em `Int`, com a unidade no nome (`priceInCents`). Sem `Decimal` |
| Data e hora | Instante. DTO tipado `Date`, com `@IsDate` e `StringToDate` (ISO 8601 estrito); resposta em ISO com `Z`. Comparar ou derivar no domínio só via `UTCDate` |
| Data sem hora | Data de calendário (nascimento, vencimento). `@db.Date` no banco; `string` `AAAA-MM-DD` no DTO e no read model, com `@Matches` e `@IsISO8601` estrito. A conversão para `Date` fica só no adapter Prisma |
| Número e booleano na query | `StringToNumber` e `StringToBoolean`. No `where`, o filtro entra com `!== undefined` |
| Campo com formato | E-mail, CPF, CNPJ, telefone, CEP: o DTO só valida string. O VO valida e normaliza antes de gravar: use case no anêmico, factory no rico |
| Id de outro módulo | `@IsUUID('4')` no DTO. Coluna `String` solta, com `@@index` |
| Lista de valores simples | `String[]` no Prisma. `@IsArray` e validadores com `{ each: true }` |
| `Json` e objeto aninhado | Fora da receita |
| Índice | `@@index` em id de outro módulo e em coluna filtrada da lista. `@unique` só quando o pedido disser único |
| Edição parcial | Campo ausente chega do `ValidationPipe` como `undefined` e não sobrescreve o valor atual. Proibido mesclar com `{ ...atual, ...dto }` |
| Spec de DTO | Input e query têm spec via `ValidationPipe(pipeOptions)`. Read model e output não |

## Regras compartilhadas

- Import absoluto `src/...`, salvo onde a skill da peça manda relativo (seed em `prisma/seeds/`, símbolo do mesmo módulo em entidade e factory).
- Classe do use case sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`. Exemplo: classe `CreateFaq` em `create-faq.service.ts`.
- Controller só chama `execute`.
- Um filter global já existe (`APP_FILTER` = `HttpExceptionFilter` para `AppException`). Código novo lança subclasse de `AppException`. Sem segundo filter.
- Create devolve `{ id }` (`*OutputDto`). Update e delete devolvem `SuccessMessage` de `src/core/dtos/success-message.dto.ts`. Proibido criar outro DTO de mensagem.
- `:id` da rota usa `Params` de `src/infra/validators/class/dtos/params/params.dto.ts`. Proibido DTO novo de id.
- Query de lista estende `Queries` de `src/infra/validators/class/dtos/queries/queries.dto.ts`. `page`, `size` e `search` não se reescrevem.
- Lista: DAO devolve `[Dto[], number]`. Use case faz `new Pagination(items, total, page, size).getDto()`. DAO usa `this.prisma.paginationFactory(page, size)`.
- Token em `src/core/di/token.ts`: `Symbol.for('XxxDao')` / `Symbol.for('XxxRepository')`, nome sem `I`.
- Use case injeta a porta com `@Inject(TOKENS.XxxDao)`. Nunca importa a classe do adapter.
- Documentação HTTP só pelo helper `Swagger` de `src/infra/openapi/swagger.ts`. Sem `@ApiOkResponse` / `@ApiTags` soltos no controller.

## Drift conhecido

Arquivos que já existem e divergem da lei. Não copiar o trecho.

| Arquivo | O que ignorar | No lugar |
|---|---|---|
| `src/app/account/infra/driven/persistence/prisma/account-prisma.dao.ts` | Classe `AccountPrismaAdapterDao` | `XxxDaoAdapterPrisma`. O select duplo (público vs `WithSensitiveData`) segue a lei de segredo |
| `src/app/account/domain/enums/account-status.enum.ts` | Valores `'Ativo'`, `'Inativo'`, `'Pendente'` | `SCREAMING_SNAKE` |
