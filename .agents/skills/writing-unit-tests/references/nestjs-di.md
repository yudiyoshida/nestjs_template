# Classes com injeção de dependência (NestJS)

Leia este arquivo antes de escrever o spec de uma classe Nest com DI no construtor (`@Injectable`, `@Controller`, guard, filter, interceptor, gateway).

Use para classes Nest com DI no construtor (`@Injectable`, `@Controller`, guard,
filter, interceptor, gateway). VOs, funções puras e mappers: `new` direto. Apenas
**unitário** com mocks — não gere `*.integration.spec.ts` (módulo real, Prisma).

**Montagem:** `let sut` + `let` por dependência; `beforeEach(async() => { ... })` com
`createMock<T>()`, `Test.createTestingModule({ providers: [Sut, { provide: token, useValue: mock }] }).compile()`,
`sut = module.get(Sut)`. Token symbol → `TOKENS.X` (ler o arquivo que exporta `TOKENS` é permitido);
classe concreta → própria classe como token. Controller → `controllers: [X]`, use
cases em `providers` com `createMock`. **Proibido:** módulos de infra reais, `PrismaService`, I/O.

**Por cenário:** `jest.spyOn(dep, 'm').mockResolvedValue` / `mockRejectedValue` no Arrange;
`afterEach(() => jest.restoreAllMocks())` se usar `spyOn`. **Não gere** `it('should be defined')`.
No passo 2: `toHaveBeenCalledWith`, dependência não chamada no aborto, `mockRejectedValue` propagado.
DTO repetido → `makeX(overrides: Partial<T> = {})` no topo do arquivo.

Exemplo (use case com dao mockado). Import `'<Símbolo>'`: trocar pelo caminho real
do arquivo que exporta o símbolo. O alvo (`./find-all-tip.service`) fica ao lado do spec.

```ts
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from '<TOKENS>';
import type { ITipDao } from '<ITipDao>';
import { FindAllTipQueryDto } from '<FindAllTipQueryDto>';
import { FindAllTip } from './find-all-tip.service';

describe('FindAllTip - Unit tests', () => {
  let sut: FindAllTip;
  let tipDao: ITipDao;

  beforeEach(async() => {
    tipDao = createMock<ITipDao>();

    const module = await Test.createTestingModule({
      providers: [
        FindAllTip,
        { provide: TOKENS.TipDao, useValue: tipDao },
      ],
    }).compile();

    sut = module.get(FindAllTip);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    describe('Happy path', () => {
      it('should return a paginated dto built from the dao result', async() => {
        // Arrange
        const tips = [{ id: 'tip-id' }];
        const query: FindAllTipQueryDto = { page: 1, size: 10 };
        jest.spyOn(tipDao, 'findAll').mockResolvedValue([tips, 1]);

        // Act
        const result = await sut.execute(query);

        // Assert
        expect(tipDao.findAll).toHaveBeenCalledWith(query);
        expect(result.totalItems).toBe(1);
        expect(result.data).toEqual(tips);
      });
    });

    describe('Error path', () => {
      it('should propagate when the dao rejects', async() => {
        // Arrange
        const query: FindAllTipQueryDto = { page: 1, size: 10 };
        jest.spyOn(tipDao, 'findAll').mockRejectedValue(new Error('db down'));

        // Act & Assert
        await expect(sut.execute(query)).rejects.toThrow('db down');
      });
    });

    describe('Edge cases', () => {
      it('should return empty data when the dao returns no rows', async() => {
        // Arrange
        const query: FindAllTipQueryDto = { page: 1, size: 10 };
        jest.spyOn(tipDao, 'findAll').mockResolvedValue([[], 0]);

        // Act
        const result = await sut.execute(query);

        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalItems).toBe(0);
      });
    });
  });
});
```
