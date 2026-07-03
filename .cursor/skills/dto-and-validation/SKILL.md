---
name: dto-and-validation
description: >-
  DTOs e validação no nestjs_template. Use ao criar Input/Output/Query DTOs,
  aplicar class-validator, decorators custom (@Trim, @StringToNumber), ou Swagger.
---

# DTOs e Validação

## Contexto

DTOs são **classes** (não interfaces) com decorators `class-validator` + `@nestjs/swagger`.

## Localização

| Tipo | Onde |
|---|---|
| DTO de saída do agregado | `application/dtos/<modulo>.dto.ts` (sem decorators) |
| Input/Output de use case | `application/usecases/<verbo>-<modulo>/dtos/` |
| Query | `FindAll<Entity>QueryDto extends Queries` |
| Param | `Params` de `src/infra/validators/class/dtos/params/params.dto.ts` |

## Input DTO

```typescript
export class CreateFaqInputDto {
  @ApiProperty({ example: 'Como faço para recuperar minha senha?' })
  @IsString()
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(512)
  @Trim()
  question: string;

  @ApiProperty({ example: 'Clique em "Esqueci minha senha".' })
  @IsString()
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192)
  @Trim()
  answer: string;
}
```

## Query DTO

```typescript
export class FindAllFaqQueryDto extends Queries {
  // campos adicionais de filtro
}
```

`Queries` fornece `page`, `size`, `search` com validação e `@StringToNumber()`.

## Decorators Custom Disponíveis

| Decorator | Uso |
|---|---|
| `@Trim()` | Strings — remove espaços |
| `@StringToNumber()` | Query/path params numéricos — antes de `@IsInt`/`@IsPositive` |

## Convenções

- Mensagens em **pt-BR** com `$property`
- `@MaxLength` casando com `@db.Text`/`@db.VarChar(N)` do schema
- `@ApiProperty` ou `@ApiPropertyOptional` em cada campo de input
- Edit DTO: `PartialType(Create<Entity>InputDto)` do `@nestjs/swagger`
- DTO de saída do agregado **sem decorators**

## ValidationPipe Global

Configurado em `src/infra/validators/class/config.ts` com `whitelist: true` e `transform: true`.

## Anti-Padrões

- ❌ DTO como interface (decorators não funcionam)
- ❌ Mensagens de validação em inglês
- ❌ Esquecer `@Trim()` em strings
- ❌ `@IsInt` sem `@StringToNumber()` em query params
