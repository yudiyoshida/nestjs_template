---
name: dao-pattern
description: >-
  Padrão DAO no nestjs_template. Use ao criar interface de DAO, adapter Prisma,
  queries findAll/findById, paginação, filtros, ou decidir o que vai no DAO vs Repository.
---

# Padrão DAO

## Contexto

DAO é o port de **leitura** (sempre presente) e de **escrita** em CRUD simples. Em DDD, escrita fica no Repository.

## Interface

```typescript
export interface IFaqDao {
  findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]>;
  findById(id: string): Promise<FaqDto | null>;
  save(data: CreateFaqInputDto): Promise<string>;    // CRUD simples
  edit(id: string, data: EditFaqInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Adapter Prisma

```typescript
const FaqSelect = {
  id: true,
  question: true,
  answer: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;

@Injectable()
export class FaqDaoAdapterPrisma implements IFaqDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);
    const where: Prisma.FaqWhereInput = queries.search
      ? { OR: [
          { question: { contains: queries.search, mode: 'insensitive' } },
          { answer: { contains: queries.search, mode: 'insensitive' } },
        ] }
      : {};

    const [faqs, total] = await this.prisma.$transaction([
      this.prisma.faq.findMany({ where, skip: pagination.skip, take: pagination.take, select: FaqSelect, orderBy: { createdAt: 'desc' } }),
      this.prisma.faq.count({ where }),
    ]);

    return [faqs, total];
  }
}
```

## Obrigatórios

1. `<Entity>Select satisfies Prisma.<Entity>Select` no topo
2. `findAll`: `findMany` + `count` em `$transaction([...])`
3. Pagination via `prisma.paginationFactory(page, size)`
4. Search com `contains: search.trim(), mode: 'insensitive'`
5. Where com array `conditions[]` + `AND` quando múltiplos filtros
6. Retorno: `Dto`, `Dto[]`, `[Dto[], number]`, ou `null`
7. Em DDD: DAO **não tem** `save/edit/delete`

## DAO vs Repository

| | DAO | Repository (DDD) |
|---|---|---|
| Retorno | DTO | Entidade |
| Escrita | CRUD simples | DDD (save/edit/delete) |
| Reidratação | Não | `Factory.load(props)` |

## Anti-Padrões

- ❌ Lançar erro de domínio no DAO (retorne `null`)
- ❌ `save/edit/delete` no DAO de módulo DDD
- ❌ Instanciar entidade no DAO
