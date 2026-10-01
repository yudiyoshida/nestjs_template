---
name: writing-integration-tests
description: Escreve testes de integração Jest (*.integration.spec.ts) de use cases e de DAO/Repository Prisma contra o banco de teste, com módulo Nest real, adapters fake de infra (NODE_ENV=test), limpeza do banco por teste e asserção no retorno e no estado persistido. Use quando o usuário pedir para criar, gerar, escrever, completar ou revisar teste de integração, integration test, teste com banco, teste de DAO, repository, persistência ou Prisma, teste de use case ponta a ponta, ou quando um use case, DAO ou repository novo precisar da spec de integração.
---

# Writing Integration Tests

Escreve `*.integration.spec.ts` para use cases e adapters de persistência (DAO/Repository Prisma), rodando contra o banco de teste com o módulo Nest real e os adapters fake de infra.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos de teste do projeto para descobrir o padrão de teste de integração.**

Todo o padrão — sufixo, montagem do módulo, banco de teste, limpeza, dados e asserções — está definido aqui. O formato do arquivo (describes, paths, AAA, hooks, `it.each`) vem da skill `writing-unit-tests`; esta skill define só o que muda na integração.

Antes de escrever, **não**:

- leia, abra ou busque outros `*.spec.ts` / `*.integration.spec.ts` para copiar formato
- rode grep/glob por `createTestingModule`, `deleteMany`, `Integration tests`
- copie estilo legado (comentário didático, `should be defined`, `expect.assertions` + `catch`, `setTimeout`), mesmo que divirja desta skill

Se um teste existente contradiz esta skill, **esta skill vence**.

**Permitido ler** (para entender comportamento, não para copiar formato):

- o arquivo alvo e o que ele importa (DTOs, erros, porta, entidade, factory)
- o módulo Nest da feature e o persistence module — só para saber o que importar
- `prisma/schema/*.prisma` — só para montar dado válido e a ordem de limpeza (FKs)
- `src/core/di/token.ts` — só para obter adapter fake via `TOKENS`

Exceção: usuário apontar um arquivo como referência, ou pedir edição de um `*.integration.spec.ts` que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que é integração (banco real), não unitário
- [ ] 2. Ler o alvo, o módulo da feature e o schema Prisma das tabelas tocadas
- [ ] 3. Listar cenários por fonte de teste e por path, com o estado esperado no banco
- [ ] 4. Escrever <alvo>.integration.spec.ts (montagem e dados desta skill; formato da writing-unit-tests)
- [ ] 5. Rodar a suíte do arquivo; guarda do banco falhou → parar e avisar o usuário
- [ ] 6. Checklist de entrega
```

## Quando usar

| Alvo | O que a integração prova |
|------|--------------------------|
| Use case (`application/usecases/<uc>/<uc>.service.ts`) | Grafo real do módulo: use case + porta + adapter Prisma + banco |
| DAO/Repository Prisma (`infra/driven/persistence/`) | Query real: `where`, `select`, ordenação, paginação, mapeamento para DTO/entidade |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| VO, função pura, mapper, entidade, factory | Skill `writing-unit-tests` |
| Controller, guard, filter, adapter de vendor | Skill `writing-unit-tests` (com mocks) |
| HTTP ponta a ponta (rota, pipe, guard, filter) | Fora (sem skill; planejada writing-e2e-tests) |
| Vendor real (Redis, S3, SMTP, API externa) | Não testar em integração — o adapter fake vem do `NODE_ENV=test` |

## Estrutura de pastas

```
<pasta do alvo>/
  <alvo>.ts
  <alvo>.integration.spec.ts
test/
  jest.global-setup.ts        # guarda do banco de teste (já existe; não editar)
```

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| Arquivo | `<alvo>.integration.spec.ts`, ao lado do alvo | `edit-product.service.integration.spec.ts` |
| describe global | `'<Classe> - Integration tests'` | `'EditProduct - Integration tests'` |
| Instância sob teste | `sut` | — |
| Factory de dado | `make<Entidade>(overrides)` no topo do arquivo | `makeProduct({ status: ProductStatus.INACTIVE })` |

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha, `async()` sem espaço antes do parêntese.

### A — Use case

Módulo fictício `product` (ilustrativo — adapte nomes e imports ao alvo). Uma fonte de teste (`execute`): paths direto no describe global.

```ts
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ProductStatus } from 'src/app/product/domain/enums/product-status.enum';
import { ProductCannotBeEditedError } from 'src/app/product/domain/errors/product-cannot-be-edited.error';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductModule } from 'src/app/product/product.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditProduct } from './edit-product.service';

function makeProduct(overrides: Partial<Prisma.ProductCreateInput> = {}): Prisma.ProductCreateInput {
  return {
    name: 'Caneta azul',
    status: ProductStatus.ACTIVE,
    ...overrides,
  };
}

describe('EditProduct - Integration tests', () => {
  let sut: EditProduct;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditProduct);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.product.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('Happy path', () => {
    it('should persist the new name when the product is active', async() => {
      // Arrange
      const product = await prisma.product.create({ data: makeProduct() });

      // Act
      await sut.execute(product.id, { name: 'Caneta preta' });

      // Assert
      const saved = await prisma.product.findUnique({ where: { id: product.id } });
      expect(saved?.name).toBe('Caneta preta');
    });
  });

  describe('Error path', () => {
    it('should throw ProductNotFoundError when the product does not exist', async() => {
      // Act & Assert
      await expect(sut.execute('non-existing-id', { name: 'Caneta preta' })).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw ProductCannotBeEditedError and keep the name when the product is inactive', async() => {
      // Arrange
      const product = await prisma.product.create({ data: makeProduct({ status: ProductStatus.INACTIVE }) });

      // Act & Assert
      await expect(sut.execute(product.id, { name: 'Caneta preta' })).rejects.toThrow(ProductCannotBeEditedError);
      const saved = await prisma.product.findUnique({ where: { id: product.id } });
      expect(saved?.name).toBe(product.name);
    });
  });
});
```

### B — DAO/Repository

Código real de `account`. Várias fontes de teste (um método público cada): um describe por método, paths dentro.

```ts
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountPrismaAdapterDao } from './account-prisma.dao';

function makeAccount(overrides: Partial<Prisma.AccountCreateInput> = {}): Prisma.AccountCreateInput {
  return {
    email: 'jhondoe@email.com',
    password: 'hashed-password',
    status: AccountStatus.ACTIVE,
    roles: { create: { role: AccountRole.STUDENT } },
    ...overrides,
  };
}

describe('AccountPrismaAdapterDao - Integration tests', () => {
  let sut: AccountPrismaAdapterDao;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
      ],
      providers: [
        AccountPrismaAdapterDao,
        PrismaService,
      ],
    }).compile();

    sut = module.get(AccountPrismaAdapterDao);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('findById', () => {
    describe('Happy path', () => {
      it('should return the account without sensitive data', async() => {
        // Arrange
        const account = await prisma.account.create({ data: makeAccount() });

        // Act
        const result = await sut.findById(account.id);

        // Assert
        expect(result).toEqual({
          id: account.id,
          email: 'jhondoe@email.com',
          status: AccountStatus.ACTIVE,
          roles: [AccountRole.STUDENT],
        });
      });
    });

    describe('Edge cases', () => {
      it('should return null when the id does not exist', async() => {
        // Act
        const result = await sut.findById('non-existing-id');

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('resetPassword', () => {
    describe('Happy path', () => {
      it('should save the new password and clear the reset token', async() => {
        // Arrange
        const account = await prisma.account.create({ data: makeAccount({ passwordResetToken: 'reset-token' }) });

        // Act
        await sut.resetPassword(account.id, 'new-hashed-password');

        // Assert
        const saved = await prisma.account.findUnique({ where: { id: account.id } });
        expect(saved?.password).toBe('new-hashed-password');
        expect(saved?.passwordResetToken).toBeNull();
      });
    });
  });
});
```

## Montagem do módulo

| Alvo | `imports` | `providers` | `sut` |
|------|-----------|-------------|-------|
| Use case | `[XxxModule, ConfigModule]` | — | `module.get(UseCase)` |
| DAO/Repository | `[ConfigModule]` | `[Adapter, PrismaService]` | `module.get(Adapter)` |

- `ConfigModule` **sempre**: é ele que carrega o `.env.test` (`DATABASE_URL`). Sem ele, o teste depende do ambiente de quem roda.
- Nada de `createMock` para porta de persistência — o ponto do teste é o banco real.
- Infra (cache, SMTP, upload, lookups): `XxxModule.register()` já entrega o adapter fake com `NODE_ENV=test` (skill `using-ports-and-adapters`). Não sobrescrever provider.
- Fake necessário no teste → guardar no `beforeAll` com `module.get<ICacheGateway>(TOKENS.CacheGateway)`. Preparar estado pela API do fake (`set`, `delete`); `jest.spyOn` só para conferir chamada e argumento. **Proibido** acessar membro privado (`service['cacheGateway']`).
- Erro de DI por `TOKENS.LoggerGateway` → importar `LoggerModule.register()`: no app ele vem do `InfraModule`, que o teste não carrega.

## Banco de teste

Specs de integração apagam tabelas. Por isso o banco de teste é **dedicado**: nome terminando em `_test`.

- `test/jest.global-setup.ts` lê o `DATABASE_URL` (do ambiente ou do `.env.test`) e aborta o Jest se o nome do banco não terminar em `_test`.
- Guarda falhou → **parar** e avisar o usuário. Nunca desligar a guarda, nunca apontar o `.env.test` para outro banco.
- Schema no banco de teste: `npm run db:migration:test`.

Preparo, feito pelo usuário (`.env.test` é local, fora do git):

```bash
docker compose -f docker-compose.dev.yml exec postgres createdb -U postgres template_test
# .env.test → DATABASE_URL=postgresql://<usuário>:<senha>@localhost:5432/template_test
npm run db:migration:test
```

## Isolamento e dados

- `beforeAll` monta o módulo e a conexão; `beforeEach` faz `deleteMany` de toda tabela que o teste escreve; `afterAll` chama `prisma.$disconnect()`.
- Ordem da limpeza: filha antes da mãe (FK). Relação com `onDelete: Cascade` permite apagar só a mãe (ex.: `account` leva `Role` e `Admin`).
- Dado de teste: `make<Entidade>(overrides)` no topo do arquivo, devolvendo `Prisma.<Model>CreateInput`. O `it` passa só o que define o cenário.
- Tempo: datas fixas (`new Date('2025-01-01T00:00:00.000Z')`) e `createdAt` explícito para ordenação. **Proibido** `setTimeout` ou sleep para separar timestamps — deixa o teste lento e instável.
- Nenhum teste depende de outro nem da ordem de execução.

## Asserções

- Conferir o retorno do `sut` **e** o estado no banco (`prisma.<model>.findUnique` / `count`). Persistência só é provada lendo o banco.
- Erro: `await expect(sut.execute(...)).rejects.toThrow(XxxError)` num bloco `// Act & Assert`; em seguida, conferir que o banco não mudou.
- Campo gerado (`id`, `createdAt`, `updatedAt`): `expect.any(String)` / `expect.any(Date)`.
- Sem `it('should be defined')`: módulo que não compila já falha no `beforeAll`.

## Formato do arquivo

- Seguir a skill `writing-unit-tests`, seções "Estrutura obrigatória do arquivo" e "Hooks": describe global, describe por método quando houver 2+ fontes, `Happy path` → `Error path` → `Edge cases`, `it('should ...')`, AAA, linhas em branco.
- Valem as "Convenções deste projeto" da `writing-unit-tests`, exceto duas: o describe global termina em `- Integration tests`, e as dependências não são mockadas (seção "Montagem do módulo").
- Nenhum comentário além do AAA.

## Rodar

```bash
docker compose -f docker-compose.dev.yml up postgres -d
npm test -- src/path/to/file.integration.spec.ts
```

Se falhar: corrigir o teste quando a expectativa estiver errada; falha que indica bug no código de produção → **reportar ao usuário**, sem alterar produção para o teste passar.

## Red flags

| Desculpa | Realidade |
|----------|-----------|
| "Mocko o DAO para ficar rápido" | Aí é unitário (skill `writing-unit-tests`). Integração prova a query real. |
| "Aponto o `.env.test` para o banco do dev só para rodar" | `deleteMany` apaga dados do dev. Banco `_test` ou não roda. |
| "Espio o cache pelo membro privado" | `module.get(TOKENS.CacheGateway)`. |
| "Um `setTimeout` resolve a ordem do `createdAt`" | `createdAt` explícito no dado. |
| "Confiro só o retorno do use case" | Persistência só é provada lendo o banco. |
| "Adiciono `should be defined` por garantia" | Módulo quebrado já falha no `beforeAll`. |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Teste unitário (com mocks) | Skill `writing-unit-tests` |
| Teste HTTP ponta a ponta | Fora (sem skill; planejada writing-e2e-tests) |
| Model e seed Prisma | Fora (sem skill; planejada creating-prisma-models) |
| `.env.test` e criação do banco de teste | Fora (sem skill) — usuário ajusta; arquivo local, fora do git |
| `test/jest.global-setup.ts` | Não editar |
| Código de produção | Não alterar para o teste passar; bug → reportar ao usuário |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Alvo é use case ou DAO/Repository Prisma (resto: skill `writing-unit-tests`)
- [ ] Arquivo `<alvo>.integration.spec.ts` ao lado do alvo
- [ ] describe global `'<Classe> - Integration tests'`; estrutura e formatação da `writing-unit-tests`
- [ ] Use case montado com `[XxxModule, ConfigModule]`; DAO/Repository com `[ConfigModule]` + `[Adapter, PrismaService]`
- [ ] Nenhum `createMock` de porta de persistência; infra via adapter fake do `NODE_ENV=test`
- [ ] Fake obtido por `module.get(TOKENS.X)`; nenhum acesso a membro privado
- [ ] `beforeAll` monta; `beforeEach` limpa as tabelas escritas (filha antes da mãe); `afterAll` faz `$disconnect`
- [ ] Dados via `make<Entidade>(overrides)`; datas fixas; nenhum `setTimeout`
- [ ] Cada cenário confere retorno e estado no banco; erro com `rejects.toThrow` e banco intacto
- [ ] Sem `it('should be defined')` e sem comentário além do AAA
- [ ] Guarda do banco passou (`.env.test` aponta para banco `*_test`)
- [ ] `npm test -- <arquivo>.integration.spec.ts` passou
- [ ] Código de produção não alterado (ou bug reportado ao usuário)
- [ ] Nenhum padrão copiado de outros testes do repositório — apenas esta skill
