---
name: creating-domain-factory
description: Cria a factory de domínio do módulo rico, único lugar que chama _instantiate. Use quando o usuário pedir para criar factory, fábrica da entidade, create, load ou edit do agregado, ou UUID da entidade.
---

# Factory de domínio

A skill produz a factory rica: `create*` valida, gera o `id` e define o estado inicial; `load` reidrata; `edit` faz merge e revalida.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de factory.** Todo o padrão — métodos estáticos, `_instantiate`, `validateCreateProps`, `create*`, `load`, `edit`, `UUID`, `UTCDate`, classe de erro — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para copiar seções ou a forma da factory

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta a entidade, o enum, a classe de erro, `UUID` ou `UTCDate` — só para o import apontar esse arquivo. Não copiar o corpo

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

Esta skill não tem bloco base. Entidade, enum, classe de erro, `UUID` e `UTCDate` não são recriados aqui.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar módulo rico (estado inválido não pode existir). Anêmico: parar, sem factory
- [ ] 2. Localizar entidade, enum, classes de erro, UUID e UTCDate pelo export (ausente → Fora do escopo; não recriar)
- [ ] 3. Escrever a factory pelo template. Trocar Example, createWithPlace e os campos pelo módulo do pedido
- [ ] 4. Spec não nasce aqui dentro de scaffold (passo 6 dela). Peça única: inventorying-test-scenarios, depois writing-unit-tests na seção unitária
- [ ] 5. Checklist de entrega
```

O grep do passo 2 só acha o arquivo do export. Não serve para copiar corpo nem para descobrir convenção. Substituir `Example` pelo nome da entidade do pedido antes de buscar a entidade, o enum e os erros. `UUID` e `UTCDate` permanecem.

```bash
grep -rn "export class Example " src
grep -rn "export type ExampleCreateProps" src
grep -rn "export enum ExampleStatus" src
grep -rn "export class ExampleTitleEmptyError" src
grep -rn "export class ExamplePlaceIdRequiredError" src
grep -rn "export class UUID" src
grep -rn "export class UTCDate" src
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Pedido de factory ou fábrica da entidade rica | Escrever `src/app/<modulo>/domain/factories/<modulo>.factory.ts` |
| Criação do agregado com `id` novo e estado inicial | Método `create*` |
| Reidratar registro já persistido | Método `load` |
| Alterar campos de criação e revalidar | Método `edit` |

`<modulo>` é o kebab singular da pasta. A classe é `<Entidade>Factory`. O exemplo abaixo usa `ExampleFactory` e a pasta `example`.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| CRUD sem invariante que o objeto precise proteger | Skill `scaffolding-anemic-module`. Sem factory |
| Escolher anêmico, rico ou interno | Skill `choosing-module-shape` |
| Forma da entidade, `props`, transição de status | Skill `creating-domain-entity` |
| Arquivo do enum | Skill `creating-domain-enum` |
| Classe do erro | Skill `creating-custom-errors` |
| `UUID`, `UTCDate` ou outro value object | Skill `creating-value-objects` |
| Use case | Skill `creating-use-case` |
| Porta e `repository.delete` | Skill `creating-persistence-ports` |
| Controller | Skill `creating-controllers` |
| Arquivo `*.spec.ts` | Skill `writing-unit-tests` |

## Lei

- A classe só tem métodos estáticos. O único lugar que chama `Example._instantiate` é esta factory.
- `ExampleCreateProps` e `ExampleProps` vêm da entidade. A factory importa esses tipos e não os declara de novo. Neste exemplo a entidade exporta `title: string`, `createdBy: string` e `placeId: string | null` em `ExampleCreateProps`. `ExampleProps` acrescenta `id: string`, `status: ExampleStatus` e `expiresAt: Date | null`.
- `ExampleEditProps` nasce neste arquivo. Os campos são os de create que o pedido permite alterar, todos opcionais. Sem `id`. Sem `status`.
- `private static validateCreateProps` aplica a validação comum de create. String vazia ou só espaço lança classe de erro. A condição do exemplo é `typeof props.title !== 'string' || !props.title || !props.title.trim()`. A factory não grava o texto cortado.
- `create` valida, gera `id` com `new UUID().value`, fixa `status: ExampleStatus.ACTIVE` e define `expiresAt` com `UTCDate.create()`, `addDays(1)` e `.value`. O spread de `props` vem antes de `id`, `status` e `expiresAt`, para o input não sobrescrever esses campos.
- `createWithPlace` repete a validação comum e aplica a invariante deste método: `placeId` ausente lança `ExamplePlaceIdRequiredError`. `expiresAt` fica `null`. O pedido troca o nome do método e o campo. `createWeather` e `createLocal` são nomes desse tipo, não um segundo formato.
- Invariante exclusiva de um `create*` fica nesse método. `edit` não a reaplica.
- `load` chama `_instantiate(props)` sem validar regra de criação e sem gerar UUID.
- `edit` faz merge `{ ...entity.props, ...props }`, chama só `validateCreateProps` e devolve `_instantiate(merged)`. Status não muda aqui. Transição de status é método da entidade.
- Quando um `create*` fixa tipo discriminador, o valor é membro `SCREAMING_SNAKE` do enum. O arquivo do enum não nasce aqui.
- Data de domínio só via `UTCDate`. UUID só via `new UUID().value`.
- Falha de validação é classe de erro sem argumento no `throw`. Proibido `new AppException('texto')`. Proibido `HttpException` do Nest.
- A factory não chama `expire()` nem outro método de transição. Não importa Prisma nem Nest.
- Símbolo de `src/shared` ou `src/core` usa import absoluto `src/...`. Símbolo do mesmo módulo usa import relativo.

## Templates

`Example`, `title`, `placeId`, `create` e `createWithPlace` são do exemplo. O pedido troca o nome do módulo, os campos e o nome de cada `create*`. A forma permanece.

Import da entidade, do enum, dos erros, de `UUID` e de `UTCDate`: trocar pelo caminho real do arquivo que o passo 2 achou. Ausente: não recriar o arquivo nesta skill.

Destino: `src/app/<modulo>/domain/factories/<modulo>.factory.ts`.

```ts
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { Example, ExampleCreateProps, ExampleProps } from '../entities/example.entity';
import { ExampleStatus } from '../enums/example-status.enum';
import { ExamplePlaceIdRequiredError } from '../errors/example-place-id-required.error';
import { ExampleTitleEmptyError } from '../errors/example-title-empty.error';

export class ExampleFactory {
  private static validateCreateProps(props: ExampleCreateProps): void {
    if (typeof props.title !== 'string' || !props.title || !props.title.trim()) {
      throw new ExampleTitleEmptyError();
    }
  }

  static create(props: ExampleCreateProps): Example {
    this.validateCreateProps(props);

    const now = UTCDate.create();
    const expiresAt = now.addDays(1);

    return Example._instantiate({
      ...props,
      id: new UUID().value,
      status: ExampleStatus.ACTIVE,
      expiresAt: expiresAt.value,
    });
  }

  static createWithPlace(props: ExampleCreateProps): Example {
    this.validateCreateProps(props);

    if (!props.placeId) {
      throw new ExamplePlaceIdRequiredError();
    }

    return Example._instantiate({
      ...props,
      id: new UUID().value,
      status: ExampleStatus.ACTIVE,
      expiresAt: null,
    });
  }

  static load(props: ExampleProps): Example {
    return Example._instantiate(props);
  }

  static edit(entity: Example, props: ExampleEditProps): Example {
    const merged: ExampleProps = {
      ...entity.props,
      ...props,
    };

    this.validateCreateProps(merged);

    return Example._instantiate(merged);
  }
}

export type ExampleEditProps = {
  title?: string;
};
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Entidade, `ExampleCreateProps`, `ExampleProps`, método de status | Skill `creating-domain-entity` |
| Arquivo `domain/enums/<nome>.enum.ts` | Skill `creating-domain-enum` |
| `ExampleTitleEmptyError`, `ExamplePlaceIdRequiredError` e qualquer outro erro | Skill `creating-custom-errors` |
| `UUID`, `UTCDate` ou outro value object | Skill `creating-value-objects` |
| Use case | Skill `creating-use-case` |
| `repository.delete(id)` e demais portas | Skill `creating-persistence-ports` |
| Controller | Skill `creating-controllers` |
| `*.spec.ts` da factory | Skill `writing-unit-tests` |

O spec cobre: `create` feliz (`id`, `ACTIVE`, data), título vazio, `createWithPlace` sem `placeId`, `load` com título vazio sem lançar, `edit` que troca só o campo enviado, `edit` com título vazio. Esta skill não traz o spec.

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Arquivo em `src/app/<modulo>/domain/factories/<modulo>.factory.ts`
- [ ] Classe só com métodos estáticos e único chamador de `_instantiate`
- [ ] `create` valida, gera `UUID`, fixa `ACTIVE` e data via `UTCDate`, com spread de `props` antes desses campos
- [ ] `createWithPlace` (ou o `create*` do pedido) aplica a invariante exclusiva e não a coloca em `validateCreateProps`
- [ ] `load` não valida e não gera UUID
- [ ] `edit` faz merge, revalida só `validateCreateProps` e não muda status
- [ ] `ExampleEditProps` sem `id` e sem `status`
- [ ] Falha de validação é classe de erro. Sem `new AppException('texto')` e sem `HttpException`
- [ ] Sem Prisma, sem Nest, sem chamada a `expire()`
- [ ] Scaffold: spec não escrito aqui. Peça única: `inventorying-test-scenarios` na factory; bug possível parou e perguntou; `writing-unit-tests` só na seção unitária
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
