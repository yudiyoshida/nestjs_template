---
name: use-case-creation
description: >-
  Criação de use cases no nestjs_template. Use ao implementar Create, Edit, Delete,
  FindAll, FindById, ou qualquer caso de uso novo.
---

# Criação de Use Cases

## Contexto

Use cases orquestram a lógica de aplicação. Um método público `execute(...)`, injeção de ports, retorno sempre em DTO.

## Template

```typescript
@Injectable()
export class CreateFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly dao: IFaqDao,
  ) {}

  public async execute(input: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    const id = await this.dao.save(input);
    return { id };
  }
}
```

## Convenções

| Aspecto | Regra |
|---|---|
| Classe | `<Verbo><Entity>` (sem sufixo Service/UseCase) |
| Arquivo | `<verbo>-<modulo>.service.ts` |
| Método | `execute(...)` — único método público |
| Retorno | DTO ou `SuccessMessage` — nunca entidade |
| Injeção de port | `@Inject(TOKENS.X)` + `import type` |
| Injeção de use case | Direto no construtor (módulo origem precisa `exports`) |

## FindAll com Paginação

```typescript
public async execute(queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
  const [result, total] = await this.dao.findAll(queries);
  return new Pagination(result, total, queries.page, queries.size).getDto();
}
```

## CRUD vs DDD

| Operação | CRUD simples | DDD-light |
|---|---|---|
| Create | `dao.save(input)` | `factory.create()` → `repository.save(entity)` |
| Edit | `dao.edit(id, input)` | `factory.edit(entity, input)` → `repository.edit(entity)` |
| Delete | `dao.delete(id)` | `repository.delete(id)` |
| FindById | `dao.findById(id)` | `repository.findById(id)` → mapear para DTO |

## Anti-Padrões

- ❌ Retornar entidade do domínio
- ❌ Lógica de negócio complexa sem entity (em DDD)
- ❌ Acessar Prisma diretamente no use case
