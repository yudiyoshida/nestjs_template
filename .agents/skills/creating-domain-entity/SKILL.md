---
name: creating-domain-entity
description: Cria a entidade rica de domínio em src/app/<modulo>/domain/entities, com construtor privado, _instantiate, props em cópia e transição de status. Use quando o usuário pedir para criar entidade, agregado, transição de status ou invariante de domínio.
---

# Entidade de domínio

A skill produz a classe da entidade rica: estado inválido não nasce e transição de status só passa pelo método que protege o invariante.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de entidade.** Todo o padrão — construtor privado, `_instantiate`, `props` em cópia, predicado, `expire()`, data com `UTCDate`, erro de domínio na transição — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para copiar seções ou a forma da entidade

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta o enum, a classe de erro ou `UTCDate` — só para o import apontar esse arquivo. Não copiar o corpo

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

Esta skill não tem bloco base. Enum, classe de erro e `UTCDate` não são recriados aqui.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar módulo rico (estado inválido não pode existir). Anêmico: parar, sem entidade
- [ ] 2. Localizar enum, classe de erro e UTCDate pelo export (ausente → Fora do escopo; não recriar)
- [ ] 3. Escrever a entidade pelo template. Trocar Example e os campos pelo módulo do pedido
- [ ] 4. Delegar o spec à skill writing-unit-tests
- [ ] 5. Checklist de entrega
```

O grep do passo 2 só acha o arquivo do export. Não serve para copiar corpo nem para descobrir convenção. Substituir `Example` pelo nome da entidade do pedido antes de buscar o enum e o erro. `UTCDate` permanece.

```bash
grep -rn "export enum ExampleStatus" src
grep -rn "export class ExampleCannotBeExpiredError" src
grep -rn "export class UTCDate" src
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Pedido de entidade ou agregado cujo estado inválido não pode existir | Escrever `src/app/<modulo>/domain/entities/<modulo>.entity.ts` |
| Transição de status no módulo rico | Método na forma de `expire()` |
| Invariante que compara data de expiração | Predicado `hasExpired` com `UTCDate` |

`<modulo>` é o kebab singular da pasta. A classe é o PascalCase desse nome. O exemplo abaixo usa `Example` e a pasta `example`.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| CRUD sem invariante que o objeto precise proteger | Skill `scaffolding-anemic-module`. Sem entidade |
| Escolher anêmico, rico ou interno | Skill `choosing-module-shape` |
| `create`, `load`, `edit`, UUID ou estado inicial | Skill `creating-domain-factory` |
| Arquivo do enum | Skill `creating-domain-enum` |
| Classe do erro | Skill `creating-custom-errors` |
| Value object (`UTCDate`, CPF, e-mail) | Skill `creating-value-objects` |
| Use case | Skill `creating-use-case` |
| Porta e `repository.delete` | Skill `creating-persistence-ports` |
| Controller | Skill `creating-controllers` |
| Arquivo `*.spec.ts` | Skill `writing-unit-tests` |

## Lei

- Construtor privado. Quem de fora instancia chama `static _instantiate`. O único chamador de produção é a factory.
- `get props()` devolve `{ ...this._props }`. A cópia é rasa. O chamador não recebe o objeto interno. A referência `_props` é `readonly`; a transição atribui o campo (`this._props.status = ...`).
- Predicado só lê `_props` e devolve boolean.
- Mutação só por método que protege o invariante. O molde de status é `expire()`: se não está ativo, lança a classe de erro; senão atribui `ExampleStatus.EXPIRED`.
- Outra transição de status copia essa forma (guarda, classe de erro, atribui). O membro do enum é `SCREAMING_SNAKE` (`ACTIVE`, `EXPIRED`). A entidade não declara o enum.
- Delete físico não é método da entidade. Sem `remove()`, sem `delete()`, sem soft delete. Delete não é transição de status. No rico, a porta faz `repository.delete(id)` depois de o use case achar a entidade.
- No rico, o use case carrega a entidade, chama o método e `repository.edit`. Esta skill não escreve o use case nem a porta.
- Falha de invariante é classe de erro (`ExampleCannotBeExpiredError`). Proibido `new AppException('texto')`. Proibido `HttpException` do Nest.
- A entidade não gera `id`, não valida regra de criação e não importa Prisma nem Nest. `id` já vem em `ExampleProps`. UUID e estado inicial são a factory.
- Símbolo de `src/shared` ou `src/core` usa import absoluto `src/...`. Símbolo do mesmo módulo usa import relativo.
- `expiresAt` e `hasExpired` entram quando o pedido compara data. Sem data, omitir os dois e o import de `UTCDate`. Comparar data com `UTCDate.from`, `UTCDate.create` e `isAfter`.

## Templates

`Example`, `title`, `createdBy` e `expiresAt` são do exemplo. O pedido troca o nome do módulo e os campos. A forma (construtor, `_instantiate`, `props`, predicados, `expire`) permanece.

Import do enum, do erro e de `UTCDate`: trocar pelo caminho real do arquivo que o passo 2 achou. Ausente: não recriar o arquivo nesta skill.

Destino: `src/app/<modulo>/domain/entities/<modulo>.entity.ts`.

```ts
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { ExampleStatus } from '../enums/example-status.enum';
import { ExampleCannotBeExpiredError } from '../errors/example-cannot-be-expired.error';

export type ExampleCreateProps = {
  title: string;
  createdBy: string;
};

export type ExampleProps = ExampleCreateProps & {
  id: string;
  status: ExampleStatus;
  expiresAt: Date | null;
};

export class Example {
  private readonly _props: ExampleProps;

  static _instantiate(props: ExampleProps): Example {
    return new Example(props);
  }

  private constructor(props: ExampleProps) {
    this._props = props;
  }

  public get props(): Readonly<ExampleProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.status === ExampleStatus.ACTIVE;
  }

  public isExpired(): boolean {
    return this._props.status === ExampleStatus.EXPIRED;
  }

  public hasExpired(): boolean {
    if (!this._props.expiresAt) return false;

    const expirationDate = UTCDate.from(this._props.expiresAt);
    const now = UTCDate.create();

    return now.isAfter(expirationDate);
  }

  public expire(): void {
    if (!this.isActive()) {
      throw new ExampleCannotBeExpiredError();
    }
    this._props.status = ExampleStatus.EXPIRED;
  }
}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Factory (`_instantiate` na criação, `load`, `edit`, UUID) | Skill `creating-domain-factory` |
| Arquivo `domain/enums/<nome>.enum.ts` | Skill `creating-domain-enum` |
| Classe `ExampleCannotBeExpiredError` e qualquer outro erro de domínio | Skill `creating-custom-errors` |
| `UTCDate` ou outro value object | Skill `creating-value-objects` |
| Use case que carrega, chama o método e `repository.edit` | Skill `creating-use-case` |
| `repository.delete(id)` e demais portas | Skill `creating-persistence-ports` |
| Controller | Skill `creating-controllers` |
| `*.spec.ts` da entidade | Skill `writing-unit-tests` |

O spec cobre: predicados, `expire` com status ativo, `expire` fora de ativo lançando a classe de erro, `props` devolvendo cópia, `hasExpired` quando houver data. O arrange usa `_instantiate` com props já válidas. Criação e validação de entrada ficam na factory. Esta skill não traz o spec.

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Arquivo em `src/app/<modulo>/domain/entities/<modulo>.entity.ts`
- [ ] Construtor privado e `static _instantiate`. A factory é o único chamador de produção
- [ ] `props` devolve `{ ...this._props }`
- [ ] `expire()` guarda `isActive`, lança classe de erro e atribui `EXPIRED`
- [ ] Sem `remove()`, `delete()` ou soft delete
- [ ] Sem Prisma, sem Nest, sem gerar `id`
- [ ] Sem `new AppException('texto')` e sem `HttpException`
- [ ] Enum comparado pelo membro `ACTIVE` / `EXPIRED` (`SCREAMING_SNAKE`)
- [ ] Data comparada com `UTCDate`, quando o pedido tem data
- [ ] Spec delegado à skill `writing-unit-tests`, com arrange em `_instantiate`
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
