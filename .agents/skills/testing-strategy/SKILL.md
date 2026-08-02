---
name: testing-strategy
description: >-
  Estratégia de testes no nestjs_template. Use ao escrever testes unit ou
  integration, configurar mocks, limpar banco em testes, ou entender sufixos
  e padrões de describe/it.
---

# Estratégia de Testes

## Contexto

Testes co-locados ao lado do código. Tudo em `*.spec.ts` — o tipo é definido pelo `describe`, não pelo sufixo do arquivo.

## Tipos de Teste

| Alvo | Tipo | Estratégia | Describe |
|---|---|---|---|
| Controller | Unit | `createMock` para use cases | `'<Sujeito> - Unit tests'` |
| Guard | Unit | `createMock` para deps | `'<Sujeito> - Unit tests'` |
| Use case | Integration | Módulo real + banco real | `'<Sujeito> - Integration tests'` |
| DAO/Repository | Integration | Provider real + banco real | `'<Sujeito> - Integration tests'` |
| DTO | Unit | `validateSync` ou `ValidationPipe` | `'<Dto> - Unit tests'` |
| Entity/Factory | Unit | Teste puro (sem NestJS) | `'<Sujeito> - Unit tests'` |

## Unit Test (Controller)

```typescript
describe('FaqAdminController - Unit tests', () => {
  let sut: FaqAdminController;
  let createFaqService: CreateFaq;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [FaqAdminController],
      providers: [
        { provide: CreateFaq, useValue: createMock<CreateFaq>() },
      ],
    }).compile();

    sut = module.get(FaqAdminController);
    createFaqService = module.get(CreateFaq);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
```

- Use `createMock<T>()` do `@golevelup/ts-jest`
- Importe `AuthenticationGuardsModule` real (não mockar guards)

## Integration Test (Use Case / DAO)

```typescript
describe('CreateFaq - Integration tests', () => {
  let sut: CreateFaq;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(CreateFaq);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.faq.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
```

## Padrões Obrigatórios

- `let sut: <Class>` — variável universal
- Helper `makeValid<X>Input(overrides = {})` no topo
- Triple-A com comentários `// Arrange`, `// Act`, `// Assert`
- Primeiro `it`: `should be defined`
- Integration: `beforeAll` (setup), `beforeEach(deleteMany)`, `afterAll($disconnect)`
- Não use `Promise.all` em integration tests com unique constraints
- Mensagens de assert alinhadas a erros **pt-BR**
- Banco de teste via `DATABASE_URL` em `.env.test`

## Anti-Padrões

- ❌ Sufixo `*.integration.spec.ts` (use `*.spec.ts` com describe correto)
- ❌ `prisma.truncate()` (não existe — use `deleteMany`)
- ❌ Mockar DAO em teste de use case (use banco real)
- ❌ Testar contra banco de produção
