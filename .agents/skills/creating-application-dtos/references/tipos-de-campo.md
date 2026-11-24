# Tipos de campo

Leia este arquivo quando for escrever campo que não seja texto nem enum: inteiro, dinheiro, booleano, data e hora, data sem hora, id de outro módulo ou lista.

Cada bloco mostra o campo obrigatório do input. PATCH e campo opcional usam os mesmos validators, com `@ApiPropertyOptional`, `@IsOptional` colado na propriedade e `?:`. Os nomes dos campos são ilustração: usar os do pedido.

Campo com formato (e-mail, CPF, CNPJ, telefone, CEP) não está aqui: usa o template de string do `SKILL.md`, sem regex no DTO. `Json`, objeto aninhado e número decimal que não é dinheiro estão fora da receita.

## Inteiro

```ts
@ApiProperty({ example: 3 })
@IsInt({ message: '$property deve ser um número inteiro' })
quantity: number;
```

`@Min` e `@Max` só quando o pedido fixar o limite:

```ts
@Min(1, { message: '$property não pode ser menor que 1' })
@Max(10, { message: '$property não pode ser maior que 10' })
```

## Dinheiro

Centavos em inteiro. A unidade vai no nome do campo.

```ts
@ApiProperty({ example: 1990 })
@IsInt({ message: '$property deve ser um número inteiro' })
@Min(0, { message: '$property não pode ser menor que 0' })
priceInCents: number;
```

## Booleano

No body, o JSON já traz booleano. A string `'true'` é recusada.

```ts
@ApiProperty({ example: true })
@IsBoolean({ message: '$property deve ser um booleano' })
isPublished: boolean;
```

## Data e hora

`StringToDate` converte só string ISO 8601 estrita. Data impossível (`2026-02-30`), string solta e número chegam crus, e o `@IsDate` recusa.

```ts
@ApiProperty({ example: '2026-01-31T12:00:00.000Z' })
@IsDate({ message: '$property deve ser uma data ISO 8601 válida' })
@StringToDate()
publishedAt: Date;
```

Só para instante (`publishedAt`, `expiresAt`). Data de calendário segue o bloco abaixo.

## Data sem hora

Nascimento, vencimento e outra data de calendário. Não é instante: entra e sai como texto `AAAA-MM-DD`, sem `StringToDate`. O `@Matches` recusa data com hora; o `@IsISO8601` estrito recusa dia impossível (`2026-02-30`). As duas mensagens são diferentes para o erro não sair repetido quando os dois falham.

```ts
@ApiProperty({ example: '2026-01-31', format: 'date' })
@Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property deve ser uma data no formato AAAA-MM-DD' })
@IsISO8601({ strict: true }, { message: '$property deve ser uma data válida' })
birthDate: string;
```

A conversão para `Date` fica só no adapter Prisma.

## Id de outro módulo

A skill não confere se o registro existe.

```ts
@ApiProperty({ example: '3f1c2a5e-8b7d-4c1e-9a2b-6d5e4f3a2b1c' })
@IsUUID('4', { message: '$property deve ser um UUID válido' })
@Trim()
categoryId: string;
```

## Lista de textos

Sem `@Trim()`: ele não percorre lista. `@ArrayNotEmpty({ message: '$property não pode ser uma lista vazia' })` só quando o pedido exigir pelo menos um item.

```ts
@ApiProperty({ example: ['nest', 'prisma'] })
@IsArray({ message: '$property deve ser uma lista' })
@IsString({ each: true, message: '$property deve ser uma lista de strings' })
@IsNotEmpty({ each: true, message: '$property não pode ter item vazio' })
tags: string[];
```

## Filtro na query

Query chega como string. Número e booleano passam pelo decorator de conversão. `@IsOptional` vem antes do validator, como em `Queries`. Filtro de data fica fora até o pedido definir a forma.

```ts
@ApiPropertyOptional()
@IsOptional()
@IsInt({ message: '$property deve ser um número inteiro' })
@StringToNumber()
quantity?: number;

@ApiPropertyOptional()
@IsOptional()
@IsBoolean({ message: '$property deve ser um booleano' })
@StringToBoolean()
isPublished?: boolean;

@ApiPropertyOptional()
@IsOptional()
@IsUUID('4', { message: '$property deve ser um UUID válido' })
categoryId?: string;
```

## Read model

Inteiro e centavos são `number`, booleano é `boolean`, data e hora é `Date`, data sem hora é `string` `AAAA-MM-DD`, id é `string`, lista é `string[]`. Ausência é `| null`. Lista nunca é `null`: vazia é `[]`.

```ts
export class ExampleDto {
  id: string;
  quantity: number;
  priceInCents: number;
  isPublished: boolean;
  publishedAt: Date | null;
  birthDate: string | null;
  categoryId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Imports

`IsArray`, `IsBoolean`, `IsDate`, `IsInt`, `IsISO8601`, `IsNotEmpty`, `IsOptional`, `IsString`, `IsUUID`, `Matches`, `Min`, `Max` e `ArrayNotEmpty` vêm de `class-validator`. `StringToNumber`, `StringToBoolean`, `StringToDate` e `Trim` vêm do arquivo do bloco base do `SKILL.md`.
