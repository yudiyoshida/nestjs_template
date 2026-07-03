---
name: architecture-overview
description: >-
  Visão geral da arquitetura nestjs_template. Use quando precisar entender stack,
  camadas hexagonais, estrutura de pastas, bootstrap, composição de módulos,
  ou como o projeto está organizado.
---

# Visão Geral da Arquitetura

## Contexto

O `nestjs_template` é um template NestJS 10 com arquitetura **Hexagonal (Ports & Adapters)** + **DDD-light** opcional. Módulos de referência ficam em `src/app/_examples/`.

## Stack

- NestJS 10 + Express + Passport JWT + Swagger 8
- Prisma 5.22 + PostgreSQL (schema multi-arquivo em `prisma/schema/*.prisma`)
- Redis (cache) + Winston (logger)
- Jest 29 + `@golevelup/ts-jest`
- Autorização por **roles** (`@RequiredRoles`)

## Camadas por Feature

```
infra/drivers (HTTP controllers)
        ↓
application (use cases, DTOs, ports)
        ↓                  ↑
domain (entities, factories, errors)
                            │
infra/driven (Prisma adapters)
```

## Estrutura Global

| Pasta | Responsabilidade |
|---|---|
| `src/app/` | Módulos de feature (`account`, `authentication`, `_examples/`) |
| `src/core/` | Config, DI tokens, filters, DTOs compartilhados |
| `src/infra/` | Gateways cross-cutting (cache, database, logger, openapi, validators) |
| `src/shared/` | Value objects reutilizáveis |
| `prisma/` | Schema único + seeds |

## Bootstrap (`src/main.ts`)

1. `NestFactory.create(AppModule)`
2. Swagger em `/swagger` com `addBearerAuth()`
3. `ValidationPipe` global com `pipeOptions`
4. `helmet()`, `compression()`, `enableCors()`

## Composição (`src/app.module.ts`)

```typescript
@Module({
  imports: [CoreModule, InfraModule, AuthenticationModule],
})
export class AppModule {}
```

Novos módulos de feature devem ser importados aqui.

## Módulos de Referência

| Padrão | Módulo | Localização |
|---|---|---|
| CRUD simples (só DAO) | FAQ | `src/app/_examples/faq/` |
| DDD-light (entity + factory + repository) | Tip | `src/app/_examples/tip/` |
| Autenticação | Authentication | `src/app/authentication/` |
| Conta | Account | `src/app/account/` |

## Anti-Padrões

- ❌ Importar DAO de outro módulo diretamente
- ❌ Lógica de negócio em controllers
- ❌ `@nestjs/*` ou `@prisma/*` em `domain/`
- ❌ Domain events, CQRS, MediatR
