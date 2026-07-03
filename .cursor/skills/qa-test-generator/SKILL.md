---
name: qa-test-generator
description: >-
  Gerador de testes QA sênior para nestjs_template. Use ao criar matriz de cenários,
  gerar specs unit/integration/DTO, ou estender cobertura de testes de um módulo.
---

# QA Test Generator

## Contexto

Workflow de QA sênior para gerar testes seguindo os padrões do `nestjs_template`.

## Fase 1 — Descoberta

1. Identificar arquivo/módulo alvo
2. Mapear dependências (DAO, Repository, outros use cases)
3. Verificar specs existentes (evitar duplicação)
4. Identificar model Prisma para limpeza (`prisma.<model>.deleteMany()`)

## Fase 2 — Matriz de Cenários

Tabela exaustiva antes de escrever código:

| Cenário | Tipo | Prioridade |
|---|---|---|
| Happy path | Integration | Alta |
| Entidade não encontrada (404) | Integration | Alta |
| Validação de input inválido | DTO unit | Alta |
| Paginação (page/size) | Integration | Média |
| Busca (search) | Integration | Média |
| Unicidade (409) | Integration | Média |
| Autorização (403) | Controller unit | Média |
| Campos opcionais em edit | Integration | Baixa |

## Fase 3 — Confirmação

Apresentar matriz ao usuário. Aguardar aprovação de escopo/prioridades.

## Fase 4 — Implementação

### Mapeamento Arquivo → Tipo

| Arquivo | Tipo de spec | Setup |
|---|---|---|
| `*-admin.controller.ts` | Unit | `createMock` + `AuthenticationGuardsModule` |
| `*-user.controller.ts` | Unit | `createMock` |
| `*.service.ts` (use case) | Integration | `imports: [<Modulo>Module]` |
| `*-prisma.dao.ts` | Integration | Provider + `PrismaService` |
| `*.dto.ts` (input) | DTO | `validateSync` ou `ValidationPipe` |
| `*.entity.ts` | Unit | Teste puro |

### Scaffold Integration (Use Case)

```typescript
describe('Create<X> - Integration tests', () => {
  let sut: Create<X>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [<X>Module],
    }).compile();
    sut = module.get(Create<X>);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.<camelCase>.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
```

### Scaffold Unit (Controller)

```typescript
describe('<X>AdminController - Unit tests', () => {
  let sut: <X>AdminController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [<X>AdminController],
      providers: [
        { provide: Create<X>, useValue: createMock<Create<X>>() },
      ],
    }).compile();
    sut = module.get(<X>AdminController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
```

## Fase 5 — Verificação

1. `npm test -- <arquivo.spec>` nos arquivos tocados
2. `npm run lint` se houver `.ts` alterado
3. Relatório final com contagem e exclusões intencionais

## Anti-Padrões

- ❌ `*.integration.spec.ts` como sufixo
- ❌ `prisma.truncate()`
- ❌ Escrever 20 `it()` de uma vez sem validar incrementalmente
- ❌ Mockar use case em teste de controller com cenário de integração
