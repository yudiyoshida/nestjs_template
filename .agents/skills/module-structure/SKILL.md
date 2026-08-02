---
name: module-structure
description: >-
  Estrutura de módulos NestJS no nestjs_template. Use ao criar módulo novo,
  organizar pastas domain/application/infra, ou entender como FAQ e Tip estão
  estruturados.
---

# Estrutura de Módulos

## Contexto

Cada feature é um módulo NestJS com 3 camadas: `domain/`, `application/`, `infra/`.

## Estrutura CRUD Simples (referência: FAQ)

```
src/app/_examples/faq/
├── faq.module.ts
├── domain/
│   └── errors/
│       └── faq-not-found.error.ts
├── application/
│   ├── dtos/faq.dto.ts
│   ├── persistence/
│   │   ├── faq-persistence.module.ts
│   │   └── dao/faq-dao.interface.ts
│   └── usecases/
│       ├── create-faq/
│       ├── edit-faq/
│       ├── delete-faq/
│       ├── find-all-faq/
│       └── find-faq-by-id/
└── infra/
    ├── driven/persistence/faq.dao.ts
    └── drivers/http/
        ├── admin/faq-admin.controller.ts
        └── user/faq-user.controller.ts
```

## Estrutura DDD-light (referência: Tip)

```
src/app/_examples/tip/
├── tip.module.ts
├── domain/
│   ├── entities/tip.entity.ts
│   ├── factories/tip.factory.ts
│   ├── enums/
│   └── errors/
├── application/
│   ├── dtos/tip.dto.ts
│   ├── persistence/
│   │   ├── tip-persistence.module.ts
│   │   ├── dao/tip-dao.interface.ts
│   │   └── repository/tip-repository.interface.ts
│   └── usecases/...
└── infra/
    ├── driven/persistence/prisma/
    │   ├── tip-prisma.dao.ts
    │   └── tip-prisma.repository.ts
    └── drivers/http/...
```

## Module Raiz

```typescript
@Module({
  imports: [
    <Modulo>PersistenceModule,
    AuthenticationGuardsModule,  // se tiver rotas protegidas
  ],
  controllers: [<Modulo>AdminController, <Modulo>UserController],
  providers: [Create<X>, Edit<X>, Delete<X>, FindAll<X>, FindById<X>],
  exports: [],  // exportar use cases se outros módulos precisarem
})
export class <Modulo>Module {}
```

## Scaffolding

Use `npm run generate:module <nome>` para gerar a estrutura base via `scripts/cli.ts`.

## Anti-Padrões

- ❌ Barrel files (`index.ts`) nos módulos
- ❌ Controller importando DAO diretamente
- ❌ `domain/` importando de `application/` ou `infra/`
