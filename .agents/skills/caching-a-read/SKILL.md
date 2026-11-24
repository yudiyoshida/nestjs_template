---
name: caching-a-read
description: Aplica cache-aside numa leitura com CacheKeyBuilder e ICacheGateway, gravando só valor existente. Use quando o usuário pedir para cachear uma leitura, cache-aside, chave de cache, CacheKeyBuilder, gravar o resultado de um find no cache, ou o TTL de uma leitura.
---

# Cachear uma leitura

Esta skill produz o cache-aside de uma leitura já existente: chave, get, leitura na falta e set apenas quando o valor existe.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de cache-aside.** Todo o padrão — gramática da chave, sequência get/leitura/set, injeção por `TOKENS.CacheGateway`, union `Resource`, par ttl `30` e skipLog `true`, builder, erro e interface — está definido aqui e apenas aqui.

Antes de escrever, o agente não:

- lê arquivo existente para copiar formato
- roda grep ou glob para inferir convenção
- lê adapter Redis, adapter fake, `cache.module.ts` ou spec
- abre skill vizinha para copiar seção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- a leitura que o usuário indicou como entrada
- o arquivo que exporta `CacheKeyBuilder`, `CacheKeyBuilderError` ou `ICacheGateway`, só para inserir ou reusar (seção "Bloco base")
- `src/core/di/token.ts`, só para inserir ou reusar a chave `CacheGateway`
- o grep de `AppException`, só para decidir se `CacheKeyBuilderError` pode ser recriado

Exceção: o usuário aponta um arquivo, ou pede edição de um arquivo que já existe — o agente lê só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. O agente confirma que o pedido é cache-aside de uma leitura
- [ ] 2. O agente localiza CacheKeyBuilder, CacheKeyBuilderError, ICacheGateway e TOKENS.CacheGateway pelo export (ausente → seção "Bloco base")
- [ ] 3. O agente insere o recurso novo na union Resource, ou recria o símbolo ausente pelo template
- [ ] 4. O agente escreve a leitura pelo template da seção "Templates"
- [ ] 5. O agente confirma o checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| O usuário pede cachear uma leitura, cache-aside, ou o resultado de um find no cache | Aplicar a sequência da seção "Templates" na classe que faz a leitura |
| O usuário pede chave de cache ou `CacheKeyBuilder` | A chave nasce do builder; recurso novo entra na union `Resource` |
| O usuário pede o TTL de uma leitura e omite o número | `set` recebe `30` e skipLog `true` |
| O recurso da leitura ainda não está na union `Resource` | Inserir o literal kebab uma vez, sem reescrever a classe que já existe |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Criar gateway Redis, gateway fake, `CacheModule.register` ou vendor | Skill `using-ports-and-adapters` |
| Use case sem cache | Skill `creating-use-case` |
| Logger, log de hit ou de miss | Skill `using-logger` |
| Spec da leitura com cache, ou spec do builder quando a union mudar | Skill `writing-unit-tests` |
| `AppException` ausente no momento de recriar `CacheKeyBuilderError` | Skill `creating-custom-errors` |
| Invalidar cache numa escrita | Fora (sem skill) |

## Lei do cache-aside

A leitura com cache segue estes cinco passos, nesta ordem:

1. `new CacheKeyBuilder().setResource(...).setCommand(...).build()`
2. `cacheGateway.get<T>(key)` — hit devolve o valor
3. miss: executa a leitura (use case ou porta já existente)
4. só se o valor existe (não cachear `null`): `cacheGateway.set(key, value, ttlInSeconds, skipLog)`
5. devolve o valor (ou `null`)

Chave em string solta é proibida. Template string, concatenação e helper paralelo de chave ficam de fora. Recurso novo entra na union `Resource` do builder, no arquivo `src/infra/cache/helpers/cache-key/cache-key.builder.ts`.

Injeção, no construtor da classe que faz a leitura:

```ts
@Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
```

`ICacheGateway` vem de `src/infra/cache/cache.gateway`. O agente nunca instancia Redis. O agente nunca importa adapter.

O único uso existente (`getAccount`) passa ttl `30` e skipLog `true`. Pedido que omite TTL e skipLog usa esses dois argumentos: `set(key, value, 30, true)`. Pedido que informa TTL usa esse número no terceiro argumento. Pedido que informa skipLog usa esse booleano no quarto. SkipLog omitido permanece `true`. A skill não inventa outro par.

`null` e ausente não entram no cache. O `if (fresh)` do template é a condição de gravação.

`delete` e `deleteContaining` existem no contrato e aparecem na interface. A skill não ensina receita de invalidar em escrita.

## Gramática da chave

A chave é uma string no formato:

`cache:{accountId|global}:{resource}:{command}[:id ou JSON]`

Os segmentos se unem com `:`.

| Segmento | Origem |
|----------|--------|
| `cache` | Literal fixo |
| `accountId` ou `global` | `setAccount(accountId)` coloca o id no segundo segmento; sem essa chamada o segmento é `global` |
| resource | Argumento de `setResource` |
| command | `'list'`, `'detail'` ou `'*'` |
| id ou JSON | Só quando `data` é truthy |

`setCommand('list', query?)` recebe `Query` opcional (`Record<string, any>`). Com query, o último segmento é `JSON.stringify(query)`, sem reordenar chaves. Sem query, a chave termina em `list`.

`setCommand('detail', id)` exige `id` string. O último segmento é esse id.

`setCommand('*')` não leva data. A chave termina em `*`.

`build()` lança `CacheKeyBuilderError` se faltar resource ou command. A mensagem cita o campo: `resource` ou `command`.

O `getAccount` não chama `setAccount`. A chave fica `cache:global:account:detail:{id}`.

Exemplos de forma, com os mesmos segmentos que `build()` produz:

```ts
new CacheKeyBuilder().setResource('account').setCommand('detail', accountId).build();
// cache:global:account:detail:{accountId}

new CacheKeyBuilder().setAccount(accountId).setResource('account').setCommand('detail', accountId).build();
// cache:{accountId}:account:detail:{accountId}

new CacheKeyBuilder().setResource('account').setCommand('list', { page: 1, size: 10 }).build();
// cache:global:account:list:{"page":1,"size":10}

new CacheKeyBuilder().setResource('account').setCommand('*').build();
// cache:global:account:*
```

`setAccount` entra na cadeia só quando o pedido pede o id no segundo segmento. A leitura canônica de detail não chama `setAccount`.

## Bloco base

Localizar pelo export antes de escrever. Se não existir, criar pelo template abaixo, no destino indicado. O corpo mora nesta skill.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `CacheKeyBuilder` | `export class CacheKeyBuilder` | `src/infra/cache/helpers/cache-key/cache-key.builder.ts` |
| `CacheKeyBuilderError` | `export class CacheKeyBuilderError` | `src/infra/cache/helpers/cache-key/cache-key-builder.error.ts` |
| `ICacheGateway` | `export interface ICacheGateway` | `src/infra/cache/cache.gateway.ts` |
| `TOKENS.CacheGateway` | `CacheGateway:` em `src/core/di/token.ts` | Inserir a chave no objeto `TOKENS` existente |
| `AppException` | `export class AppException` | Não recriar nesta skill |

```bash
grep -rn "export class CacheKeyBuilder {" src
grep -rn "export class CacheKeyBuilderError" src
grep -rn "export interface ICacheGateway" src
grep -rn "CacheGateway:" src/core/di/token.ts
grep -rn "export class AppException" src
```

O match de `CacheKeyBuilderError` não conta como `CacheKeyBuilder`.

### CacheKeyBuilder

Quando `export class CacheKeyBuilder` já existe, o agente insere um único literal novo na union `Resource`, em kebab-case (o mesmo tipo de token da union: `account`, `refresh-token`). Não duplica literal. Não altera `Command`, overloads, `setAccount`, `setResource`, `setCommand` nem `build()`. Não reescreve o arquivo.

`Command` permanece `'list' | 'detail' | '*'`.

Quando o export não existe, o agente grava o arquivo inteiro abaixo. A union do template entra inteira. Se o recurso do pedido ainda não está nela, o agente acrescenta o literal kebab antes de `'*'`.

```ts
import { CacheKeyBuilderError } from 'src/infra/cache/helpers/cache-key/cache-key-builder.error';

type Resource =
  | 'account'
  | 'refresh-token'
  | 'text'
  | '*'

type Command =
  | 'list'
  | 'detail'
  | '*'

type Id = string;
type Query = Record<string, any>;

export class CacheKeyBuilder {
  private accountId?: string;
  private resource?: Resource;
  private command?: Command;
  private data?: Id | Query;

  public setAccount(accountId: string): this {
    this.accountId = accountId;
    return this;
  }

  public setResource(resource: Resource): this {
    this.resource = resource;
    return this;
  }

  public setCommand(command: '*'): this;
  public setCommand(command: 'list', data?: Query): this;
  public setCommand(command: 'detail', data: Id): this;
  public setCommand(command: Command, data?: Id | Query): this {
    this.command = command;
    this.data = data;
    return this;
  }

  public build(): string {
    if (!this.resource) {
      throw new CacheKeyBuilderError('resource');
    }
    if (!this.command) {
      throw new CacheKeyBuilderError('command');
    }

    const keyParts: string[] = [];
    keyParts.push('cache');
    keyParts.push(this.accountId ? this.accountId : 'global');
    keyParts.push(this.resource);
    keyParts.push(this.command);

    if (this.data) {
      if (typeof this.data === 'string') {
        keyParts.push(this.data);
      }
      else {
        keyParts.push(JSON.stringify(this.data));
      }
    }

    // example: cache:global:account:list:{"page":1,"size":10}
    return keyParts.join(':');
  }
}
```

### CacheKeyBuilderError

`CacheKeyBuilderError` só é recriado quando o export da classe de erro não existe e `export class AppException` existe. O import de `AppException` usa o caminho do arquivo encontrado por esse grep. O template traz `src/core/filters/app.exception`.

`AppException` ausente: o agente não recria `CacheKeyBuilderError`, não inventa outro pai e delega a skill `creating-custom-errors`. Sem esse pai, o agente também não recria `CacheKeyBuilder` com outro erro.

Quando os dois exports existem, o agente reusa o erro. Não reescreve a classe.

```ts
import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';

export class CacheKeyBuilderError extends AppException {
  constructor(field: string) {
    super(`Não foi possível montar a chave de cache: ${field} é obrigatório.`, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'CacheKeyBuilderError';
  }
}
```

### TOKENS.CacheGateway

`CacheGateway: Symbol.for('CacheGateway')` vive dentro do objeto `TOKENS` em `src/core/di/token.ts`.

Chave já presente: reusar, sem duplicar a linha.

Arquivo presente e chave ausente: inserir só esta propriedade no objeto. Não reescrever o restante do arquivo. Não recriar `CacheModule`.

```ts
CacheGateway: Symbol.for('CacheGateway'),
```

### ICacheGateway

Export encontrado: reusar. O import da leitura usa o caminho real do arquivo. Nesta base o caminho é `src/infra/cache/cache.gateway`.

Export ausente: criar só a interface no destino `src/infra/cache/cache.gateway.ts`. O adapter e o module ficam com a skill `using-ports-and-adapters`. Esta skill não recria adapter.

```ts
export interface ICacheGateway {
  set<T>(key: string, value: T, ttlInSeconds?: number, skipLog?: boolean): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  deleteContaining(key: string): Promise<void>;
}
```

## Templates

Código da leitura. Os imports de `ICacheGateway`, `CacheKeyBuilder` e `TOKENS` usam o caminho do export localizado no bloco base. Ausente o export, vale o caminho do template.

```ts
import { Inject } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';
```

O agente acrescenta o parâmetro ao construtor e mantém as dependências que a classe já tem. `cacheGateway` é o nome do campo.

```ts
constructor(
  @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
) {}
```

Sequência canônica, no estilo de `getAccount`. A regra de conta inativa fica de fora. Numa outra leitura, o agente troca `'account'`, `'detail'`, `accountId`, `AccountDto` e `this.findAccountByIdService.execute` pelo resource, pelo command, pelo id ou query, pelo tipo e pela chamada daquela leitura (use case ou porta). Os cinco passos permanecem.

```ts
const key = new CacheKeyBuilder()
  .setResource('account')
  .setCommand('detail', accountId)
  .build();

const cached = await this.cacheGateway.get<AccountDto>(key);
if (cached) {
  return cached;
}

const fresh = await this.findAccountByIdService.execute(accountId);
if (fresh) {
  await this.cacheGateway.set(key, fresh, 30, true);
}

return fresh;
```

A chamada que produz `fresh` já existe. Esta skill não cria o use case. Pedido com TTL informado substitui só o `30`. Pedido com skipLog informado substitui só o `true`.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Adapter Redis, adapter fake, `CacheModule.register`, vendor | Skill `using-ports-and-adapters` |
| Use case sem cache | Skill `creating-use-case` |
| Logger | Skill `using-logger` |
| Spec da leitura com cache e do builder quando a union `Resource` mudar | Skill `writing-unit-tests` |
| `AppException` | Skill `creating-custom-errors` |
| Invalidação com `delete` ou `deleteContaining` | Fora (sem skill) |
| TTL ou skipLog inventados quando o pedido omite os dois (o par é `30` e `true`) | Fora (sem skill) |
| Fila | Fora (sem skill) |
| WebSocket | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] A chave nasce só de `CacheKeyBuilder`; nenhuma string solta e nenhum helper paralelo
- [ ] Recurso novo é um literal kebab na union `Resource`, sem literal duplicado; classe existente não foi reescrita
- [ ] Hit devolve o `get`; miss executa a leitura; `null` e ausente não entram no `set`
- [ ] Pedido que omite TTL chama `set(key, value, 30, true)`
- [ ] Injeção `@Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway`
- [ ] Nenhum Redis instanciado e nenhum adapter importado; gateway ausente delegado a `using-ports-and-adapters`
- [ ] Builder, `CacheKeyBuilderError` e `ICacheGateway` recriados só quando o export falta, pelos templates completos desta skill
- [ ] `CacheKeyBuilderError` não foi recriado sem `AppException`
- [ ] Invalidação, spec, logger, fila e WebSocket ficaram de fora
- [ ] Nenhum passo manda abrir `src/` ou outra skill para aprender a chave, o builder ou a interface
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
