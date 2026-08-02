---
name: gateway-adapters
description: >-
  Padrão Gateway/Adapter no nestjs_template. Use ao integrar serviços externos
  (Redis cache, Winston logger), criar adapters fake/real, ou adicionar nova
  integração externa.
---

# Gateway Adapters

## Contexto

Integrações externas seguem o padrão Gateway em `src/infra/<x>/` com adapter fake para testes.

## Gateways Existentes

| Gateway | Real | Fake | Global? |
|---|---|---|---|
| Cache | `CacheRedisAdapterGateway` | `CacheFakeAdapterGateway` | Sim |
| Logger | `LoggerWinstonAdapterGateway` | `LoggerFakeAdapterGateway` | Sim |

## Estrutura

```
src/infra/<x>/
├── <x>.gateway.ts                # interface I<X>Gateway
├── <x>.module.ts                 # XxxModule.register() (DynamicModule)
├── adapters/
│   ├── fake/<x>-fake.gateway.ts
│   └── <tecnologia>/<x>-<tecnologia>.gateway.ts
```

## Module Pattern

```typescript
@Global()
@Module({})
export class CacheModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;
    return {
      module: CacheModule,
      providers: [{
        provide: TOKENS.CacheGateway,
        useClass: isTest ? CacheFakeAdapterGateway : CacheRedisAdapterGateway,
      }],
      exports: [TOKENS.CacheGateway],
    };
  }
}
```

## Regras

1. Lib externa (`redis`, `winston`, etc.) **só** dentro de `adapters/<tecnologia>/`
2. **Sempre** ter adapter fake (usado em `NODE_ENV=test`)
3. `static register(): DynamicModule` escolhe fake vs real
4. Token em `src/core/di/token.ts` como `<Categoria>Gateway`
5. Adapter real loga via `ILoggerGateway` antes de re-lançar erros
6. `@Global()` apenas para gateways cross-cutting (cache, logger)

## Adicionar Novo Gateway

1. Criar interface em `src/infra/<x>/<x>.gateway.ts`
2. Criar adapter fake em `adapters/fake/`
3. Criar adapter real em `adapters/<tecnologia>/`
4. Criar module com `register()`
5. Adicionar token em `src/core/di/token.ts`
6. Importar no `InfraModule`

## Anti-Padrões

- ❌ Lib externa fora de `adapters/<tecnologia>/`
- ❌ Gateway sem adapter fake
- ❌ `@Global()` em gateway de feature específica
