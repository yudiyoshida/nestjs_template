---
name: creating-use-case
description: Escreve a classe de use case em application/usecases, com execute e porta injetada por token. Use quando o usuário pedir para criar use case, caso de uso, serviço de aplicação, create, edit, delete, find, comando rico, query ou comando interno sem HTTP.
---

# Use case

A skill produz a classe de aplicação que o controller ou outro módulo chama.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de use case.** Todo o padrão — classe sem sufixo `Service`, `execute`, token, retorno, `NotFound`, `actorId`, delete físico, status, paginação, comando interno — está definido neste arquivo e em `references/`.

Antes de escrever, **não**:

- leia use cases existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para copiar seções ou a forma do use case

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta `TOKENS`, a porta, a factory, o erro, o DTO, `SuccessMessage` ou `Pagination` — só para reusar o símbolo (seção "Bloco base")
- `references/` desta pasta, quando o fluxo mandar escrever o use case daquele caso
- `<modulo>.module.ts` — só para registrar a classe, quando o arquivo já existe

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o caso na tabela "Quando usar": comando anêmico, comando rico, query ou comando interno
- [ ] 2. Localizar TOKENS, porta, factory, erro e DTO pelo export (ausente → seção "Bloco base")
- [ ] 3. Escrever a classe pelo template do caso. Trocar Example pelo recurso. Ler só o arquivo do caso
      leia references/comando-anemico.md antes de escrever o comando anêmico
      leia references/comando-rico.md antes de escrever o comando rico
      leia references/query.md antes de escrever a query
      leia references/comando-interno.md antes de escrever o comando interno
- [ ] 4. Registrar a classe em providers. Módulo sem HTTP: também em exports
- [ ] 5. Spec fica com a skill writing-unit-tests. Esta skill não escreve o spec
- [ ] 6. Checklist de entrega
```

## Quando usar

| Sintoma | Template |
|---------|----------|
| Escrita sem entidade. DAO recebe e devolve DTO | `references/comando-anemico.md` |
| Create, edit, delete ou status em que estado inválido não pode existir | `references/comando-rico.md` |
| `findAll` ou `findById`. Anêmico ou rico. Devolve DTO, não entidade | `references/query.md` |
| Mutação sem controller. Lote ou rotina | `references/comando-interno.md` |

Leitura, anêmica ou rica, usa Query no DAO. Comando anêmico e comando rico não se misturam. Comando rico de escrita não usa DAO. Query não usa repository e não instancia entidade.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Decidir se o módulo é anêmico, rico ou interno | Skill `choosing-module-shape` |
| Árvore inteira do módulo | Skill `scaffolding-anemic-module`, `scaffolding-rich-module` ou `scaffolding-internal-module` |
| DTO, porta, token, module de persistência, entidade, factory, enum, classe de erro, controller | Seção "Fora do escopo" |
| Gateway de Redis, SMTP, S3 ou HTTP de terceiro | Skill `using-ports-and-adapters` |
| Arquivo `*.spec.ts` | Skill `writing-unit-tests` |

## Bloco base

A skill reusa o símbolo. Não recria o arquivo. Ausente: delegar à skill da tabela. Não escrever o arquivo alheio.

Trocar `Example` pelo recurso. Pasta do módulo em kebab, singular.

| Símbolo | Localizar por | Se ausente |
|---------|---------------|------------|
| `TOKENS.ExampleDao` / `TOKENS.ExampleRepository` | `export { TOKENS }` em `src/core/di/token.ts` | Skill `creating-persistence-ports` |
| `IExampleDao` | `export interface IExampleDao` | Skill `creating-persistence-ports` |
| `IExampleRepository` | `export interface IExampleRepository` | Skill `creating-persistence-ports` |
| `ExampleFactory` | `export class ExampleFactory` | Skill `creating-domain-factory` |
| `ExampleNotFoundError` | `export class ExampleNotFoundError` | Skill `creating-custom-errors` |
| `SuccessMessage` | `export class SuccessMessage` | Kernel em `src/core/dtos/success-message.dto.ts`. Não recriar |
| `Pagination` | `export class Pagination` | Kernel em `src/shared/value-objects/pagination/pagination.vo.ts`. Não recriar |
| DTO de input, output, query ou read model | `export class` do DTO | Skill `creating-application-dtos` |

```bash
grep -n "export { TOKENS }" src/core/di/token.ts
grep -rn "export interface IExampleDao" src
grep -rn "export interface IExampleRepository" src
grep -rn "export class ExampleFactory" src
grep -rn "export class ExampleNotFoundError" src
grep -rn "export class SuccessMessage" src/core/dtos/success-message.dto.ts
grep -rn "export class Pagination" src/shared/value-objects/pagination/pagination.vo.ts
```

## Lei

- Classe sem sufixo `Service`. Arquivo `<acao>.service.ts`. Método público `execute`. Exemplo: classe `CreateExample` em `create-example.service.ts`.
- Pasta: `src/app/<modulo>/application/usecases/<acao>/`.
- Import absoluto `src/...`. `@Injectable()` e `@Inject` de `@nestjs/common`. Porta com `import type`.
- `@Inject(TOKENS.ExampleDao)` ou `@Inject(TOKENS.ExampleRepository)`. Proibido importar a classe do adapter.
- Create devolve `{ id }` (`*OutputDto`). Edit, delete e transição de status devolvem `{ message }` tipado como `SuccessMessage`. Proibido outro DTO de mensagem.
- Create rico: segundo argumento `actorId: string`, obrigatório, entra na factory como `createdBy`. O id sai de `entity.props.id`.
- `findById` da porta devolve `null`. Use case exposto por HTTP lança `ExampleNotFoundError`. Query sem HTTP devolve o valor da porta, inclusive `null`, salvo o pedido mandar lançar.
- Instanciar o `NotFound` com os argumentos que o construtor da classe já pede. Se o construtor exige o id, passar o id. Proibido `new AppException('texto')` e `HttpException` do Nest.
- Dono em edit e delete: `actorId?: string`. Admin omite. User manda o id. `actorId` presente e `createdBy !== actorId` lança o mesmo `NotFound`. Sem dono no recurso: omitir o parâmetro e o `if`.
- Ordem no comando que carrega o recurso: load, `null` → `NotFound`, dono errado → o mesmo `NotFound`, aí factory ou método da entidade, aí a porta.
- Delete físico. Anêmico: `dao.delete(id)`. Rico: `repository.delete(id)` depois do load. Proibido método `remove()` na entidade. Proibido soft delete.
- Status não é delete. Anêmico: `dao.edit` grava a coluna. Rico: método da entidade (molde `expire()`) e `repository.edit`.
- Lista: a porta devolve `[Dto[], number]`. Use case faz `new Pagination(items, total, page, size).getDto()`.
- Comando interno: sem controller. Pode injetar DAO e repository. Registro ausente segue em frente, sem `NotFound`.
- Erro de domínio escapa. Proibido `try/catch` em volta de factory ou método da entidade.
- Proibido Prisma no use case, `process.env`, log no happy path.

Mensagem em português, com o nome do recurso: `'Example atualizado com sucesso'`, `'Example excluído com sucesso'`.

## Templates

Trocar `Example` / `example` pelo recurso. Campos ilustrativos saem explícitos, sem spread do DTO. O código do arquivo mora no `references/` do caso.

- leia `references/comando-anemico.md` antes de escrever o comando anêmico
- leia `references/comando-rico.md` antes de escrever o comando rico
- leia `references/query.md` antes de escrever a query
- leia `references/comando-interno.md` antes de escrever o comando interno

## Registro no módulo

Quando `src/app/<modulo>/<modulo>.module.ts` já existe, importar a classe e incluí-la em `providers`.

```ts
import { CreateExample } from './application/usecases/create-example/create-example.service';
```

```ts
providers: [
  CreateExample,
],
```

Módulo sem HTTP: a classe entra também em `exports`. Se `providers` e `exports` usam o mesmo array, uma entrada cobre os dois. Arquivo de módulo ausente: não criar aqui.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `*InputDto`, `*OutputDto`, `*QueryDto`, read model | Skill `creating-application-dtos` |
| `IExampleDao`, `IExampleRepository`, chave em `TOKENS` | Skill `creating-persistence-ports` |
| `ExamplePersistenceModule` | Skill `creating-persistence-module` |
| Entidade | Skill `creating-domain-entity` |
| Factory | Skill `creating-domain-factory` |
| Enum | Skill `creating-domain-enum` |
| `ExampleNotFoundError` e demais erros | Skill `creating-custom-errors` |
| Controller | Skill `creating-controllers` |
| Árvore do módulo | Skill `scaffolding-anemic-module`, `scaffolding-rich-module` ou `scaffolding-internal-module` |
| `*.spec.ts` | Skill `writing-unit-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Classe sem sufixo `Service`, arquivo `<acao>.service.ts`, `execute` público
- [ ] Porta via `@Inject(TOKENS....)`, `import type`, sem classe de adapter
- [ ] Import absoluto `src/...`
- [ ] Create devolve `{ id }`. Edit, delete e status devolvem `SuccessMessage`
- [ ] `findById` de HTTP lança `ExampleNotFoundError` quando a porta devolve `null`
- [ ] Edit e delete com dono usam `actorId?`. Dono errado é o mesmo `NotFound`. Admin omite o argumento
- [ ] Delete físico na porta. Sem `remove()` na entidade
- [ ] Status rico: método da entidade e `repository.edit`. Status anêmico: `dao.edit`. Delete não muda status
- [ ] Lista usa `new Pagination(items, total, page, size).getDto()`
- [ ] Comando interno sem controller. Registro ausente não lança `NotFound`
- [ ] Sem Prisma, sem `process.env`, sem `HttpException`, sem `new AppException('texto')`, sem log no happy path
- [ ] Classe em `providers`. Módulo sem HTTP: também em `exports`
- [ ] Spec delegado a `writing-unit-tests`
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
