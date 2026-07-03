---
name: controllers-and-swagger
description: >-
  Controllers HTTP e Swagger no nestjs_template. Use ao criar controllers admin/user,
  decorar rotas com @Swagger, @RequiredRoles, ou configurar documentação OpenAPI.
---

# Controllers e Swagger

## Contexto

Controllers são **drivers HTTP** — adaptam requisições para use cases. Sem lógica de negócio.

## Template Admin

```typescript
@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)
export class FaqAdminController {
  constructor(
    private readonly createFaq: CreateFaq,
    private readonly findAllFaq: FindAllFaq,
  ) {}

  @Post()
  @Swagger({
    tags: ['FAQs'],
    summary: 'Criar nova FAQ',
    applyBadRequest: true,
    createdResponse: CreateFaqOutputDto,
  })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaq.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['FAQs'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
}
```

## Decorator @Swagger

Localização: `src/infra/openapi/swagger.ts`

| Propriedade | Uso |
|---|---|
| `tags` | Agrupamento no Swagger UI |
| `summary` | Título da operação |
| `okResponse` | Resposta 200 com tipo |
| `okPaginatedResponse` | Resposta 200 paginada |
| `createdResponse` | Resposta 201 |
| `applyBadRequest` | Documenta 400 |
| `applyNotFound` | Documenta 404 |
| `applyForbidden` | Documenta 403 |

## Convenções

- Use `@Swagger` em **toda rota** — não use `@ApiTags` direto
- Rotas mais específicas (`:id/status`) **antes** de genéricas (`:id`)
- Admin: `@RequiredRoles(AccountRole.ADMIN)` no controller
- User: sem decorator de role (público) ou role específico
- `@Body()`, `@Query()`, `@Param()` com DTOs tipados
- Params: usar `Params` de `src/infra/validators/class/dtos/params/params.dto.ts`

## Module

Controllers precisam de `AuthenticationGuardsModule` no imports do módulo quando usam `@RequiredRoles`.

## Anti-Padrões

- ❌ Lógica de negócio no controller
- ❌ `@ApiTags` direto (use `@Swagger`)
- ❌ Controller acessando DAO diretamente
- ❌ Esquecer `@Swagger` em rotas novas
