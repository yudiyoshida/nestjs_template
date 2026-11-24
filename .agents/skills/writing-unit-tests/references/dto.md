# Spec de DTO

Leia este arquivo quando for escrever o spec de um DTO de input ou de query.

O DTO é testado pelo mesmo `ValidationPipe` que a aplicação usa, com o `pipeOptions` do projeto. Cada campo é uma fonte de teste: vira um describe com o nome do campo, e os paths ficam dentro dele. DTO com um campo só não ganha describe de campo. Read model e output de create não têm spec.

| Peça | Forma |
|---|---|
| `sut` | `new ValidationPipe(pipeOptions)` no `beforeEach` |
| `metadata` | `{ type: 'body', metatype: Dto }` no input; `type: 'query'` na query. Atribuído no `beforeEach` |
| Corpo válido | `makeBody(overrides)` no topo do arquivo; cada cenário troca só o campo dele |
| Erro | `rejects.toMatchObject({ response: { message: expect.arrayContaining(['<mensagem>']) } })` |
| Sucesso | o valor do campo no resultado do `transform`, já cortado ou convertido |

A mensagem esperada é a do decorator, com o nome do campo no lugar de `$property`. `pipeOptions` vem de `src/infra/validators/class/config`; localizar por `grep -rn "const pipeOptions" src`.

Campo que a query herda de `Queries` (`page`, `size`, `search`) não entra: o spec de `Queries` já cobre.

## Input

`src/app/example/application/usecases/create-example/dtos/create-example.dto.spec.ts`

```ts
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateExampleInputDto } from './create-example.dto';

function makeBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Título do example',
    priceInCents: 1990,
    ...overrides,
  };
}

describe('CreateExampleInputDto - Unit tests', () => {
  let sut: ValidationPipe;
  let metadata: ArgumentMetadata;

  beforeEach(() => {
    sut = new ValidationPipe(pipeOptions);
    metadata = { type: 'body', metatype: CreateExampleInputDto };
  });

  describe('title', () => {
    describe('Happy path', () => {
      it('should trim title when it has surrounding spaces', async() => {
        // Act
        const result = await sut.transform(makeBody({ title: '  Título do example  ' }), metadata);

        // Assert
        expect(result.title).toBe('Título do example');
      });
    });

    describe('Error path', () => {
      it.each([
        undefined,
        null,
        '',
        '   ',
      ])('should reject title when it is empty (%s)', async(value: unknown) => {
        // Act & Assert
        await expect(sut.transform(makeBody({ title: value }), metadata)).rejects.toMatchObject({
          response: { message: expect.arrayContaining(['title é obrigatório']) },
        });
      });
    });
  });

  describe('priceInCents', () => {
    describe('Error path', () => {
      it.each([
        19.9,
        '1990',
      ])('should reject priceInCents when it is not an integer (%s)', async(value: unknown) => {
        // Act & Assert
        await expect(sut.transform(makeBody({ priceInCents: value }), metadata)).rejects.toMatchObject({
          response: { message: expect.arrayContaining(['priceInCents deve ser um número inteiro']) },
        });
      });
    });

    describe('Edge cases', () => {
      it('should accept priceInCents when it is 0', async() => {
        // Act
        const result = await sut.transform(makeBody({ priceInCents: 0 }), metadata);

        // Assert
        expect(result.priceInCents).toBe(0);
      });

      it('should reject priceInCents when it is -1', async() => {
        // Act & Assert
        await expect(sut.transform(makeBody({ priceInCents: -1 }), metadata)).rejects.toMatchObject({
          response: { message: expect.arrayContaining(['priceInCents não pode ser menor que 0']) },
        });
      });
    });
  });
});
```

## Query

Um campo só: os paths ficam direto no describe global.

`src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto.spec.ts`

```ts
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllExampleQueryDto } from './find-all-example.dto';

describe('FindAllExampleQueryDto - Unit tests', () => {
  let sut: ValidationPipe;
  let metadata: ArgumentMetadata;

  beforeEach(() => {
    sut = new ValidationPipe(pipeOptions);
    metadata = { type: 'query', metatype: FindAllExampleQueryDto };
  });

  describe('Happy path', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('should convert isPublished %s to %s', async(input: string, expected: boolean) => {
      // Act
      const result = await sut.transform({ isPublished: input }, metadata);

      // Assert
      expect(result.isPublished).toBe(expected);
    });
  });

  describe('Error path', () => {
    it('should reject isPublished when it is not true or false', async() => {
      // Act & Assert
      await expect(sut.transform({ isPublished: 'yes' }, metadata)).rejects.toMatchObject({
        response: { message: expect.arrayContaining(['isPublished deve ser um booleano']) },
      });
    });
  });

  describe('Edge cases', () => {
    it('should keep isPublished undefined when it is absent', async() => {
      // Act
      const result = await sut.transform({}, metadata);

      // Assert
      expect(result.isPublished).toBeUndefined();
    });
  });
});
```
