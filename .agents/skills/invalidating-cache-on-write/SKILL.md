---
name: invalidating-cache-on-write
description: Apaga do cache, depois de uma escrita, as leituras que ela tornou velhas — a chave de detalhe do registro e as listas do recurso — pelo CacheKeyBuilder e pelo ICacheGateway. Use quando o usuário pedir para invalidar cache, limpar cache depois de criar, editar, apagar ou mudar status, evitar dado velho no cache, ou invalidating-cache-on-write.
---

# Invalidação de cache na escrita

Depois de gravar, apaga do cache o detalhe do registro e as listas do recurso, para a próxima leitura buscar o dado novo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de invalidação.** Todo o padrão — quando invalidar, onde, quais chaves, `delete` contra `deleteContaining`, o que fica de fora e o spec — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia adapter Redis, adapter fake ou outro use case para copiar formato
- rode grep/glob para inferir convenção
- abra skill vizinha para aprender seção ou template

Se código existente contradiz esta skill, **esta skill vence** no trecho novo.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- a leitura cacheada do recurso, só para repetir a mesma cadeia do builder (recurso e `setAccount`)
- o use case que escreve e o `<modulo>.module.ts` dele, só para inserir o trecho
- o arquivo que exporta `CacheKeyBuilder`, `ICacheGateway` ou `CacheModule`, só para reusar

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- Só invalida o que alguma leitura cacheia (skill `caching-a-read`). Recurso sem leitura cacheada: nada a fazer.
- Invalida no use case que escreve, depois da gravação. Gravação que falha lança antes e não invalida.
- A chave sai do `CacheKeyBuilder`, com a mesma cadeia da leitura (mesmo recurso e mesmo `setAccount`), trocando só o comando. Chave em string solta é proibida.
- Detalhe: `delete` da chave exata, `setCommand('detail', id)`.
- Listas: `deleteContaining` do prefixo `setCommand('list')`, sem query. Ele pega todas as páginas e filtros.
- Tudo do recurso de uma vez (lote): `deleteContaining` de `setCommand('*')`. O `*` é curinga no Redis e no fake, que segue o `MATCH` do Redis. Fora do lote, só detalhe e listas, como a tabela manda.
- `delete` e `deleteContaining` não lançam: o adapter loga a falha e segue. A escrita não falha por causa do cache; no pior caso, o dado velho vive até o TTL.
- Sem invalidar antes da escrita e sem gravar o valor novo no cache: a próxima leitura repõe.
- Injeção igual à da leitura: `@Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway`. O `<modulo>.module.ts` importa `CacheModule.register()` quando o import ainda não está lá.
- Cache usado como armazenamento (sessão, refresh token) não é leitura cacheada: fora desta skill.

O que cada escrita apaga:

| Escrita | Detalhe (`delete`) | Listas (`deleteContaining`) |
|---|---|---|
| Create | — | sim |
| Edit, transição de status | o registro | sim |
| Delete | o registro | sim |
| Comando interno em lote | tudo do recurso, num só `deleteContaining` de `setCommand('*')` | incluídas no mesmo `deleteContaining` |

Exemplo real do template: escrita em conta (status, papéis) apaga `cache:global:account:detail:<id>`, a leitura que o guard de autenticação cacheia por 30 segundos.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o recurso tem leitura cacheada e anotar a cadeia do builder dela
- [ ] 2. Localizar CacheKeyBuilder, ICacheGateway, TOKENS.CacheGateway e CacheModule (ausente → caching-a-read ou using-ports-and-adapters)
- [ ] 3. Injetar o gateway no use case que escreve e importar CacheModule.register() no módulo, se faltar
- [ ] 4. Depois da gravação, apagar o que a tabela manda para aquela escrita
- [ ] 5. inventorying-test-scenarios no use case; depois writing-unit-tests
- [ ] 6. verifying-delivery e checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Escrita em recurso cuja leitura é cacheada | Fluxo inteiro |
| Dado velho aparece depois de editar, apagar ou mudar status | Fluxo inteiro, na escrita que faltou invalidar |
| Leitura nova com cache num recurso que já tem escritas | Fluxo em cada escrita do recurso |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Cachear uma leitura | Skill `caching-a-read` |
| Gateway de cache, adapter Redis ou fake | Skill `using-ports-and-adapters` |
| Sessão ou token guardado no cache | Fora (sem skill) |
| Dado que aparece no cache de várias contas (`setAccount` diferente) | Fora (sem skill) |

## Bloco base

Localizar pelo export. Ausente: a coluna diz quem cria.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `CacheKeyBuilder` | `export class CacheKeyBuilder {` | Skill `caching-a-read` |
| `ICacheGateway` | `export interface ICacheGateway` | Skill `caching-a-read` |
| `TOKENS.CacheGateway` | `CacheGateway:` em `src/core/di/token.ts` | Skill `caching-a-read` |
| `CacheModule` | `export class CacheModule` | Skill `using-ports-and-adapters` |

```bash
grep -rn "export class CacheKeyBuilder {" src
grep -rn "export interface ICacheGateway" src
grep -rn "CacheGateway:" src/core/di/token.ts
grep -rn "export class CacheModule" src
```

## Templates

`example` é o recurso do exemplo, já na union `Resource` porque a leitura dele é cacheada. Leitura cacheada com `setAccount`: a invalidação repete o mesmo `setAccount`.

Imports da classe que escreve:

```ts
import { Inject } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { CacheKeyBuilder } from 'src/infra/cache/helpers/cache-key/cache-key.builder';
```

No `<modulo>.module.ts`, junto dos imports que já existem:

```ts
import { CacheModule } from 'src/infra/cache/cache.module';

imports: [
  CacheModule.register(),
],
```

Edit, depois da gravação:

```ts
await this.exampleDao.edit(id, data);

await this.cacheGateway.delete(new CacheKeyBuilder().setResource('example').setCommand('detail', id).build());
await this.cacheGateway.deleteContaining(new CacheKeyBuilder().setResource('example').setCommand('list').build());

return { message: 'Example atualizado com sucesso' };
```

Delete e transição de status: as mesmas duas linhas, depois do `delete` ou do `edit` da porta. Create: só a linha das listas, depois do `save`.

Comando interno em lote, tudo do recurso:

```ts
await this.cacheGateway.deleteContaining(new CacheKeyBuilder().setResource('example').setCommand('*').build());
```

### Spec do use case

O gateway entra por `TOKENS.CacheGateway` com `createMock<ICacheGateway>()`. A ordem sai do `invocationCallOrder`:

```ts
expect(jest.mocked(exampleDao.edit).mock.invocationCallOrder[0])
  .toBeLessThan(jest.mocked(cacheGateway.delete).mock.invocationCallOrder[0]);
```

Cenários que o inventário cobre: depois de gravar, `delete` com `cache:global:example:detail:<id>` e `deleteContaining` com `cache:global:example:list`; a gravação vem antes da invalidação; gravação que falha não invalida; create não chama `delete`.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Leitura com cache, recurso novo na union | Skill `caching-a-read` |
| Gateway, adapters e `CacheModule` | Skill `using-ports-and-adapters` |
| Specs | Skills `inventorying-test-scenarios` e `writing-unit-tests` |
| Sessão ou token no cache, cache de várias contas, gravar o valor novo no cache | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] O recurso tem leitura cacheada; a cadeia do builder é a mesma da leitura
- [ ] Invalidação no use case que escreve, depois da gravação
- [ ] Detalhe por `delete` da chave exata; listas por `deleteContaining` do prefixo `list`
- [ ] `setCommand('*')` só no lote; nenhuma chave em string solta
- [ ] Create sem `delete`; lote com `setCommand('*')`
- [ ] `CacheModule.register()` no módulo, se faltava; injeção por `TOKENS.CacheGateway`
- [ ] `inventorying-test-scenarios` rodou no use case; spec com a ordem gravação → invalidação
- [ ] `verifying-delivery` rodou
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
