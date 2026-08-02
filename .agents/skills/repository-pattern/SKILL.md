---
name: repository-pattern
description: >-
  Padrão Repository no nestjs_template. Use em módulos DDD-light para persistência
  de entidades, save/edit/delete, reidratação via Factory.
---

# Padrão Repository

## Contexto

Repository é o port de **escrita** em módulos DDD-light. Trabalha com entidades, não DTOs. Referência: `src/app/_examples/tip/`.

## Interface

```typescript
export interface ITipRepository {
  save(entity: Tip): Promise<string>;
  edit(entity: Tip): Promise<void>;
  findById(id: string): Promise<Tip | null>;
  delete(id: string): Promise<void>;
}
```

## Adapter Prisma

```typescript
@Injectable()
export class TipRepositoryAdapterPrisma implements ITipRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Tip): Promise<string> {
    const props = entity.props;
    const result = await this.prisma.tip.create({
      data: {
        type: props.type,
        title: props.title,
        content: props.content,
        status: props.status,
        locationId: props.locationId,
        createdBy: props.createdBy,
        expiresAt: props.expiresAt,
      },
    });
    return result.id;
  }

  public async findById(id: string): Promise<Tip | null> {
    const row = await this.prisma.tip.findUnique({ where: { id } });
    if (!row) return null;
    return TipFactory.load({ /* mapear row → TipProps */ });
  }
}
```

## Obrigatórios

1. `findById` reidrata via `<Entity>Factory.load(props)` — nunca instancie direto
2. `save(entity)` retorna `id`; `edit(entity)` retorna `void`
3. Operações multi-tabela em `prisma.$transaction(async(tx) => …)`
4. Token: `TOKENS.<Entity>Repository` em `src/core/di/token.ts`

## Anti-Padrões

- ❌ Retornar DTO no Repository
- ❌ `new Tip(props)` no adapter (usar `Factory.load`)
- ❌ Repository em CRUD simples (use só DAO)
