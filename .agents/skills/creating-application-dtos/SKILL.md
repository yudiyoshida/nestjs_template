---
name: creating-application-dtos
description: Escreve InputDto, OutputDto de create, QueryDto e read model do módulo. Use quando o usuário pedir para criar DTO, input, output, query de lista, read model, DTO de edição ou DTO com dado sensível.
---

# DTO de aplicação

A skill produz as classes de entrada, saída de create, filtro de lista e leitura do módulo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de DTO.** Todo o padrão — input com `class-validator` e `$property`, output `{ id }`, query que estende `Queries`, read model plano, `PATCH` explícito, `WithSensitiveData` — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia DTOs existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para copiar seções ou a forma do DTO

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta `Queries`, `Params`, `SuccessMessage`, `Trim` ou `StringToNumber` — só para reusar o símbolo (seção "Bloco base")
- arquivo que exporta o enum do pedido — só para importar o símbolo. A skill `creating-domain-enum` cria o enum ausente

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o formato: input de create, edição PATCH ou PUT, query ou read model
- [ ] 2. Localizar Queries, Params, SuccessMessage, Trim e StringToNumber pelo export (ausente → seção "Bloco base")
- [ ] 3. Escrever o DTO pelo template do formato. Trocar Example pelo recurso
- [ ] 4. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Body de create | `CreateExampleInputDto` e `CreateExampleOutputDto` no mesmo arquivo |
| Body de edição com campo opcional | `EditExampleInputDto` no template PATCH |
| Body que substitui o recurso inteiro | `EditExampleInputDto` no template PUT |
| Filtro de lista | `FindAllExampleQueryDto extends Queries` |
| Resposta de leitura | `ExampleDto` plano |
| Leitura com senha, token ou documento | `ExampleWithSensitiveDataDto` no mesmo arquivo do read model |

Editar no estilo de campo opcional é PATCH. Um formato por arquivo pedido. Sem filtro extra, a query fica vazia.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Classe com `execute` | Skill `creating-use-case` |
| Rota, `@Patch` ou `@Put` no controller | Skill `creating-controllers` |
| Declarar o enum | Skill `creating-domain-enum` |
| Decorator novo, compartilhado por dois DTOs | Skill `creating-class-validator-decorator` |
| Arquivo `*.spec.ts` | Skill `writing-unit-tests` |
| Mensagem de update ou delete | `SuccessMessage` do bloco base. Proibido outro DTO |
| `:id` da rota | `Params` do bloco base. Proibido DTO novo de id |

## Bloco base

Localizar pelo export. O símbolo existe: reusar, não escrever de novo. Ausente: criar o arquivo inteiro pelo template, no destino da tabela.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `Queries` | `export class Queries` | `src/infra/validators/class/dtos/queries/queries.dto.ts` |
| `Params` | `export class Params` | `src/infra/validators/class/dtos/params/params.dto.ts` |
| `SuccessMessage` | `export class SuccessMessage` | `src/core/dtos/success-message.dto.ts` |
| `Trim` | `export function Trim` | `src/infra/validators/class/decorators/trim/trim.ts` |
| `StringToNumber` | `export function StringToNumber` | `src/infra/validators/class/decorators/string-number/string-number.ts` |

```bash
grep -rn "export class Queries" src/infra/validators/class/dtos/queries/queries.dto.ts
grep -rn "export class Params" src/infra/validators/class/dtos/params/params.dto.ts
grep -rn "export class SuccessMessage" src/core/dtos/success-message.dto.ts
grep -rn "export function Trim" src/infra/validators/class/decorators/trim/trim.ts
grep -rn "export function StringToNumber" src/infra/validators/class/decorators/string-number/string-number.ts
```

`src/infra/validators/class/dtos/queries/queries.dto.ts`

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  size?: number;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  search?: string;
}
```

`src/infra/validators/class/dtos/params/params.dto.ts`

```ts
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class Params {
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  id: string;
}
```

`src/core/dtos/success-message.dto.ts`

```ts
export class SuccessMessage {
  message: string;
}
```

`src/infra/validators/class/decorators/trim/trim.ts`

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function Trim(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
```

`src/infra/validators/class/decorators/string-number/string-number.ts`

```ts
import { Transform, TransformOptions } from 'class-transformer';

export function StringToNumber(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? Number(value) : value, opts);
}
```

## Lei

- Import absoluto `src/...`.
- String de input leva `@ApiProperty` ou `@ApiPropertyOptional`, `@IsString`, `@IsNotEmpty` quando o campo enviado não pode ser vazio, `@Trim()` e `message` com `$property`.
- Mensagens de input e de filtro: `$property deve ser uma string`, `$property é obrigatório`, `$property deve ter no máximo N caracteres`, `$property deve ser um valor válido do enum`.
- `@MaxLength` só quando o pedido fixa o tamanho. Sem teto, omitir o decorator.
- Enum no body: `@ApiProperty({ enum: ExampleStatus, example: ExampleStatus.ACTIVE })` e `@IsEnum`. Sem `@Trim`.
- Campo opcional num create usa `@ApiPropertyOptional`, os validators, `@Trim()` em string e `@IsOptional` colado na propriedade.
- Create devolve `{ id: string }` no `*OutputDto`, sem validator e sem campo extra.
- Update e delete não ganham DTO. A resposta é `SuccessMessage`.
- `:id` da rota é `Params`. Proibido DTO novo de id.
- Query estende `Queries`. Proibido reescrever `page`, `size` e `search`.
- Proibido `PartialType`. Proibido segundo `Queries`, segundo `Params` ou outro DTO de mensagem.
- Read model público sem senha, token ou documento. Esses campos só entram em `ExampleWithSensitiveDataDto`.
- Valor de enum é `SCREAMING_SNAKE`. Esta skill não declara o enum.

Ordem do campo opcional, de cima para baixo: `@ApiPropertyOptional`, validators com `message`, `@Trim()`, `@IsOptional`, propriedade `?:`.

## Templates

Trocar `Example` / `example` pelo recurso. Campos `title` e `content` são ilustração: usar os campos do pedido.

### Input de create

`src/app/example/application/usecases/create-example/dtos/create-example.dto.ts`

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateExampleInputDto {
  @ApiProperty({ example: 'Título do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  title: string;

  @ApiProperty({ example: 'Texto longo do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  content: string;
}

export class CreateExampleOutputDto {
  id: string;
}
```

Campo opcional no create. Omitir quando o body não tem campo opcional.

```ts
@ApiPropertyOptional({ example: 'São Paulo' })
@IsString({ message: '$property deve ser uma string' })
@Trim()
@IsOptional()
locationId?: string;
```

Enum no body. Sem `@Trim`.

```ts
@ApiProperty({ enum: ExampleStatus, example: ExampleStatus.ACTIVE })
@IsEnum(ExampleStatus, { message: '$property deve ser um valor válido do enum' })
status: ExampleStatus;
```

`ExampleStatus` importa de `src/app/example/domain/enums/example-status.enum.ts`.

### Edição

Um dos dois corpos. Classe `EditExampleInputDto` em `src/app/example/application/usecases/edit-example/dtos/edit-example.dto.ts`. Campo opcional é PATCH. Body que substitui o recurso inteiro é PUT.

PATCH:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class EditExampleInputDto {
  @ApiPropertyOptional({ example: 'Título do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Texto longo do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  @IsOptional()
  content?: string;
}
```

PUT. Campos obrigatórios, o body substitui o recurso.

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class EditExampleInputDto {
  @ApiProperty({ example: 'Título do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(256, { message: '$property deve ter no máximo 256 caracteres' })
  @Trim()
  title: string;

  @ApiProperty({ example: 'Texto longo do example' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  content: string;
}
```

### Query

`src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto.ts`

Sem filtro extra:

```ts
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllExampleQueryDto extends Queries {}
```

Com filtro. `@IsOptional` em cada campo extra. Enum com `@IsEnum`. `page`, `size` e `search` ficam em `Queries`.

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExampleStatus } from 'src/app/example/domain/enums/example-status.enum';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllExampleQueryDto extends Queries {
  @ApiPropertyOptional({ enum: ExampleStatus })
  @IsOptional()
  @IsEnum(ExampleStatus, { message: '$property deve ser um valor válido do enum' })
  status?: ExampleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  locationId?: string;
}
```

### Read model

`src/app/example/application/dtos/example.dto.ts`

Classe plana. Sem `class-validator` e sem `@ApiProperty`. Data é `Date`. Ausência é `| null`.

```ts
import { ExampleStatus } from 'src/app/example/domain/enums/example-status.enum';

export class ExampleDto {
  id: string;
  title: string;
  status: ExampleStatus;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Leitura sensível, só quando o pedido pede senha, token ou documento. Mesmo arquivo. A classe pública continua sem esses campos. O campo abaixo troca pelo que o pedido pedir. Sem valor de credencial.

```ts
export class ExampleWithSensitiveDataDto extends ExampleDto {
  password: string;
}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Use case | Skill `creating-use-case` |
| Controller, `@Patch` e `@Put` na rota | Skill `creating-controllers` |
| Enum | Skill `creating-domain-enum` |
| Decorator novo | Skill `creating-class-validator-decorator` |
| `*.spec.ts` | Skill `writing-unit-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Input com `class-validator`, `@ApiProperty({ example })` ou `@ApiPropertyOptional`, `@Trim()` em string e `message` com `$property`
- [ ] `CreateExampleOutputDto` só com `id: string`, sem validator e sem campo extra
- [ ] PATCH com campo opcional explícito. `@IsOptional` colado na propriedade. Sem `PartialType`
- [ ] PUT com campos obrigatórios
- [ ] `FindAllExampleQueryDto extends Queries`. Sem reescrever `page`, `size` e `search`
- [ ] Read model plano, sem `class-validator`. Senha, token e documento só em `ExampleWithSensitiveDataDto`
- [ ] Sem DTO novo de id. Sem outro DTO de mensagem
- [ ] `Queries`, `Params`, `SuccessMessage`, `Trim` e `StringToNumber` reusados. Arquivo ausente criado pelo bloco base, sem segunda cópia
- [ ] Import absoluto `src/...`
- [ ] Spec delegado a `writing-unit-tests`
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
