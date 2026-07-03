---
name: prisma-conventions
description: >-
  Convenções Prisma no nestjs_template. Use ao criar models, rodar migrations,
  configurar seeds, ou entender o schema multi-arquivo e limpeza de banco em testes.
---

# Convenções Prisma

## Contexto

Schema multi-arquivo em `prisma/schema/` com `previewFeatures = ["prismaSchemaFolder"]`. Sem `prisma migrate` — usa `prisma db push`.

## Estrutura

```
prisma/
├── schema/
│   ├── schema.prisma       # generator + datasource (único lugar)
│   ├── account.prisma      # Account, Role, Admin
│   ├── faq.prisma
│   ├── text.prisma
│   └── tip.prisma
└── seeds/
```

## Arquivo Base (`schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Novo Model

Criar `prisma/schema/<modulo>.prisma` (singular, kebab-case):

```prisma
model Faq {
  id        String   @id @default(uuid())
  question  String   @db.Text
  answer    String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Relações entre models em arquivos diferentes funcionam normalmente — o Prisma mescla todos os `.prisma` da pasta.

## Convenções

| Aspecto | Regra |
|---|---|
| Arquivo por domínio | `prisma/schema/<modulo>.prisma` |
| IDs | `String @id @default(uuid())` |
| Enums | `String` no banco, enum TS no código |
| Timestamps | `createdAt` + `updatedAt` com `@default(now())` e `@updatedAt` |
| Texto longo | `@db.Text` |
| Texto curto | `@db.VarChar(N)` |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run db:migration` | `prisma db push` (dev) |
| `npm run db:seed` | Roda seeds |
| `npm run db:reset` | Reset + seed |
| `npm run db:studio` | Prisma Studio |

## PrismaService

```typescript
public paginationFactory(page?: number, size?: number) {
  return {
    skip: (page && size) ? ((page - 1) * size) : undefined,
    take: (page && size) ? size : undefined,
  };
}
```

**Não existe `truncate()`**. Em testes, limpe com `prisma.<model>.deleteMany()`.

## Limpeza em Testes

```typescript
beforeEach(async () => {
  await prisma.faq.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

Respeite ordem de FK ao limpar múltiplas tabelas (filhos antes de pais).

## Seeds

Orquestrados em `prisma/seeds/index.ts`. Rodam com `npm run db:seed`.

## Anti-Padrões

- ❌ `enum` do Prisma (use `String`)
- ❌ `generator`/`datasource` fora de `schema.prisma`
- ❌ Models no arquivo raiz `prisma/schema.prisma` (só generator + datasource)
- ❌ `prisma migrate` (projeto usa `db push`)
- ❌ Testar contra banco de produção
