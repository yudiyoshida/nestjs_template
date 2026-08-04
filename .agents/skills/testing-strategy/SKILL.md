---
name: testing-strategy
description: >-
  Estratégia de testes no nestjs_template. Use ao escrever testes unit ou
  integration, configurar mocks, limpar banco em testes, ou entender sufixos
  e padrões de describe/it.
---

# Estratégia de Testes

## Contexto

Testes **co-locados** ao lado do código (sem pasta `__tests__/`). Não existe `*.module.spec.ts` — a cobertura é por **artefato** (use case, controller, DAO, etc.).

O tipo de teste é identificado pelo **`describe`** (`'… - Unit tests'` | `'… - Integration tests'`). Em **use cases**, o sufixo do arquivo também distingue os dois arquivos:

| Artefato | Arquivo(s) | Tipo |
|---|---|---|
| Use case | `<verbo>-<modulo>.service.spec.ts` + `<verbo>-<modulo>.service.integration.spec.ts` | Unit **e** Integration (par obrigatório) |
| Controller | `*-admin.controller.spec.ts` / `*-user.controller.spec.ts` | Unit |
| Guard / strategy | `*.guard.spec.ts`, `*.strategy.spec.ts` | Unit |
| Entity / factory / VO | `*.entity.spec.ts`, `*.factory.spec.ts`, `*.vo.spec.ts` | Unit (TS puro, sem Nest) |
| DTO de input do use case | `dtos/<verbo>-<modulo>.dto.spec.ts` | Unit (`validateSync` ou `ValidationPipe`) |
| DTO de agregado (`application/dtos/*.dto.ts`) | — | Sem spec (apenas shape, sem decorators) |
| DAO / repository Prisma | `*-prisma.dao.spec.ts`, `*-prisma.repository.spec.ts` ou `*.dao.spec.ts` | Integration (**um** arquivo, sem par unit) |

Módulos em `src/app/`: **account**, **authentication**, **`_examples/faq`**, **`_examples/tip`**. O padrão acima vale para todos; `account` não expõe controllers HTTP (use cases consumidos por outros módulos).

## Tipos de Teste (resumo)

| Alvo | Unit | Integration |
|---|---|---|
| Use case | `*.service.spec.ts` — mocks nos ports (`createMock` + `TOKENS`) | `*.service.integration.spec.ts` — `imports: [<Modulo>Module]` + banco real |
| Controller | `createMock` nos use cases | — |
| Guard / strategy | `createMock` nas deps ou instância direta | — |
| DAO / repository | — | adapter real + `PrismaService` |
| DTO (input validado) | `validateSync` / `ValidationPipe` | — |
| Entity / factory | lógica pura | — |

## Unit Test — Use Case

Orquestração e ramos de erro **sem** banco: DAO/repository/outros use cases mockados.

```typescript
describe('CreateFaq - Unit tests', () => {
  let sut: CreateFaq;
  let faqDao: IFaqDao;

  beforeEach(async () => {
    faqDao = createMock<IFaqDao>();

    const module = await Test.createTestingModule({
      providers: [
        CreateFaq,
        { provide: TOKENS.FaqDao, useValue: faqDao },
      ],
    }).compile();

    sut = module.get(CreateFaq);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
```

- Use `createMock<T>()` do `@golevelup/ts-jest`
- Mockar **ports** (`TOKENS.*`); não importar o módulo de feature inteiro

## Integration Test — Use Case

Fluxo real: grafo de DI de produção + persistência + gateways fake (`NODE_ENV=test`).

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

- **Não** mockar DAO/repository neste arquivo
- Limpar com `prisma.<model>.deleteMany()` (model em camelCase)

## Unit Test — Controller

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

- Importe `AuthenticationGuardsModule` real em controllers **admin** (não mockar guards de auth)

## Integration Test — DAO / Repository

Um único `*.spec.ts` por adapter, sempre integration:

```typescript
describe('FaqDaoAdapterPrisma - Integration tests', () => {
  let sut: FaqDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [FaqDaoAdapterPrisma, PrismaService, /* … */],
    }).compile();

    sut = module.get(FaqDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.faq.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

## Padrões Obrigatórios

- `let sut: <Class>` — variável universal
- Helper `make<Verbo><Entity>Input(overrides = {}): <X>InputDto` no topo (use cases)
- Triple-A com comentários `// Arrange`, `// Act`, `// Assert`
- Primeiro `it`: `should be defined`
- Integration: `beforeAll` (setup do módulo), `beforeEach(deleteMany)`, `afterAll($disconnect)`
- Não use `Promise.all` em integration tests com unique constraints
- Mensagens de assert alinhadas a erros **pt-BR**
- Banco de teste via `DATABASE_URL` em `.env.test`
- `npm test` roda unit **e** integration (`jest` inclui `*.spec.ts` e `*.integration.spec.ts`)

## Anti-Padrões

- ❌ Use case com **apenas** um dos dois arquivos (falta unit **ou** integration)
- ❌ Mockar DAO/repository no `*.service.integration.spec.ts`
- ❌ Colocar teste de integração de use case só no `*.service.spec.ts` (unit deve usar mocks)
- ❌ `prisma.truncate()` (não existe — use `deleteMany`)
- ❌ Testar contra banco de produção
- ❌ Spec de DTO para `application/dtos/<modulo>.dto.ts` de saída (sem validação)
