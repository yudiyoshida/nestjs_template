---
name: dependency-injection
description: >-
  Injeção de dependência no nestjs_template. Use ao criar tokens DI, configurar
  persistence modules, injetar ports em use cases, ou entender o padrão Symbol.for.
---

# Injeção de Dependência

## Contexto

Tokens DI vivem **exclusivamente** em `src/core/di/token.ts` como `Symbol.for('Nome')`.

## Tokens Atuais

```typescript
const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),
  AccountDao: Symbol.for('AccountDao'),
  FaqDao: Symbol.for('FaqDao'),
  TipDao: Symbol.for('TipDao'),
  TipRepository: Symbol.for('TipRepository'),
};
```

Ao criar módulo novo, adicione `<Entity>Dao` (e `<Entity>Repository` se DDD).

## Injeção em Use Case

```typescript
@Injectable()
export class CreateFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly dao: IFaqDao,
  ) {}

  public async execute(input: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    // ...
  }
}
```

- Use `import type` para interfaces de port
- Use `@Inject(TOKENS.X)` para ports
- Use injeção direta no construtor para use cases de outros módulos (precisa de `exports` no módulo origem)

## Persistence Module

```typescript
@Module({
  providers: [
    {
      provide: TOKENS.FaqDao,
      useClass: FaqDaoAdapterPrisma,
    },
  ],
  exports: [TOKENS.FaqDao],
})
export class FaqPersistenceModule {}
```

## Gateway Module (DynamicModule)

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

1. Tokens **só** em `src/core/di/token.ts`
2. Nunca importe DAO de outro módulo — importe o `Module` e injete o use case exportado
3. Gateways externos sempre têm adapter fake para `NODE_ENV=test`

## Anti-Padrões

- ❌ Token definido fora de `src/core/di/token.ts`
- ❌ `@Inject()` sem `import type` na interface
- ❌ Importar DAO diretamente de outro módulo
