---
name: writing-integration-tests
description: Gera teste de integração Jest com Postgres real para use case e para adapter Prisma (DAO ou repository), em arquivo *.integration.spec.ts, sem mock de banco, com cenários classificados em Happy path, Error path e Edge cases. Use quando o usuário pedir teste de integração, spec de integração, integração de use case, integração de DAO, integração de repository ou writing-integration-tests.
---

# Teste de integração

Gera o spec de integração do use case ou do adapter Prisma contra o Postgres de teste.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de teste de integração.** Todo o padrão — arquivo, module de teste, `deleteMany`, ausência de mock, paths (`Happy path`, `Error path`, `Edge cases`) e AAA — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia `*.spec.ts` ou `*.integration.spec.ts` existentes para copiar formato
- rode grep/glob para inferir convenção
- abra `src/app/_examples`

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- a classe sob teste, para listar os métodos públicos e o que cada um persiste ou devolve
- o module Nest que registra essa classe, para o import do use case
- o `model` Prisma do recurso, para o delegate camelCase e as colunas do `create`
- arquivo que exporta `ConfigModule` ou `PrismaService` — só para o caminho do import (seção "Bloco base")

Exceção: usuário apontar um arquivo, ou pedir edição de um `*.integration.spec.ts` que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar o caso: use case ou adapter Prisma (DAO ou repository)
- [ ] 2. Localizar ConfigModule e PrismaService pelo export (ausente → parar)
- [ ] 3. Listar os cenários de cada método público e classificar em path
- [ ] 4. Escrever o *.integration.spec.ts do caso. Trocar Example pelo recurso
- [ ] 5. Rodar npm test no arquivo. Banco inacessível: reportar e parar
- [ ] 6. Checklist de entrega
```

1. Use case: um arquivo por classe, ao lado do service. Adapter: um arquivo por classe, ao lado do adapter. DAO e repository são arquivos diferentes. Não gerar os dois casos se o pedido nomeou só um.

2. `ConfigModule` e `PrismaService` ausentes: parar. Não recriar kernel.

3. Inventário de `inventorying-test-scenarios` para este arquivo na mesma tarefa: os cenários são a seção de integração. Não acrescentar o conjunto mínimo abaixo por cima. Seção ausente: não criar o arquivo. Sem inventário, cada método público é uma fonte e a classificação é a tabela abaixo. Path sem cenário é omitido.

| Ordem | Path | Contém |
|-------|------|--------|
| 1 | `Happy path` | linha real gravada ou lida, retorno esperado; filtro `search` que isola uma de duas linhas |
| 2 | `Error path` | erro lançado pelo alvo, inclusive not found do use case com a tabela vazia |
| 3 | `Edge cases` | tabela vazia, `null` para id inexistente, página com `size` menor que o total |

Id inexistente é o UUID `00000000-0000-0000-0000-000000000000`, porque a coluna `id` é UUID. `search` só entra se o `findAll` filtra texto. Paginação só entra se o `findAll` pagina. Método que o alvo não tem não entra.

4. Template da seção do caso. Campos do `create` são as colunas do model, sem inventar coluna. Os `it` de cada fonte ficam dentro do describe do path do passo 3.

5. `npm test -- <arquivo>.integration.spec.ts`. `NODE_ENV=test` já vem do script e carrega `.env.test` via `ConfigModule`. Falha de conexão: reportar. Proibido trocar o spec para mock. Proibido alterar código de produção para o teste passar sem confirmar; bug de produção → reportar.

## Quando usar

| Sintoma | Ação |
|---------|------|
| Integração de use case | Template "Use case" |
| Integração de DAO Prisma | Template "DAO" |
| Integração de repository Prisma | Template "Repository" |
| Pedido nomeia teste de integração, spec de integração ou esta skill | Template do caso |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Spec unitário com mock | Skill `writing-unit-tests` |
| Controller, guard, filter, DTO, entidade, factory, enum | Fora desta skill. Unitário, se a scaffold pedir, vai para `writing-unit-tests` |
| Teste HTTP ponta a ponta | Fora (sem skill) |
| Recriar `ConfigModule` ou `PrismaService` | Fora. Kernel ausente: parar |

## Lei

- Arquivo do use case: `<acao>.service.integration.spec.ts`, ao lado de `<acao>.service.ts`. O unitário `<acao>.service.spec.ts` não nasce aqui.
- Arquivo do DAO: `<modulo>-prisma.dao.integration.spec.ts`, ao lado de `<modulo>-prisma.dao.ts`.
- Arquivo do repository: `<modulo>-prisma.repository.integration.spec.ts`, ao lado de `<modulo>-prisma.repository.ts`.
- DAO e repository não ganham `*.spec.ts` com mock. O único spec dessas classes é o `*.integration.spec.ts`.
- Jest deste repositório já executa `*.integration.spec.ts` (`testRegex` `.*\.spec\.ts$`). Não criar config nova.
- Describe global: `'<Classe> - Integration tests'`. Adapter com dois métodos ou mais: um describe por método, dentro do global. Use case com só `execute`: os describes de path ficam direto no global.
- Dentro de cada fonte, os describes de path seguem a ordem do passo 3: `Happy path` → `Error path` → `Edge cases`. Nunca inverta nem intercale. Path sem cenário é omitido; os restantes mantêm a ordem.
- `it('should ...')` em inglês. Sem `it('should be defined')`.
- `sut` é a classe sob teste. `prisma` é o `PrismaService` real.
- Proibido `createMock`, `jest.fn` no Prisma, `jest.spyOn` no Prisma ou na porta, `useValue` no lugar do adapter.
- Use case sobe `imports: [ConfigModule, XxxModule]`. O module do recurso é o que já registra o use case e o adapter. Não instanciar o adapter na mão nesse spec.
- Adapter sobe `imports: [ConfigModule]` e `providers: [ClasseDoAdapter, PrismaService]`. Não importar o module HTTP.
- `beforeAll` compila uma vez. `beforeEach` limpa com `prisma.<delegate>.deleteMany()`. `afterAll` chama `prisma.$disconnect()`.
- `<delegate>` é o camelCase do `model` Prisma (`Example` → `example`).
- Filha com FK para essa tabela: `deleteMany` da filha antes, no mesmo `beforeEach`.
- Arrange de leitura: `prisma.<delegate>.create`. Assert de escrita: `prisma.<delegate>.findUnique`. Assert de leitura: retorno do `sut` comparado à linha gravada.
- Repository: a entidade entra por `ExampleFactory`. `save` grava; o assert lê o `id` em `entity.props.id`. Não dar `new` na entidade.
- AAA: comentários `// Arrange`, `// Act`, `// Assert`. Linha em branco entre esses blocos. Sem linha em branco logo depois de `=> {` nem logo antes de `});`. Act e assert na mesma expressão: um bloco `// Act & Assert`. Sem `// Arrange` quando não há o que preparar.
- `async()` e `beforeAll(async() => {` sem espaço antes do `(`.
- Import absoluto `src/...`. Import de `ConfigModule` e `PrismaService`: caminho da seção "Bloco base".

## Bloco base

Localizar pelo export. Os dois são kernel. Ausente: parar. Não recriar.

| Símbolo | Localizar por | Caminho |
|---------|---------------|---------|
| `ConfigModule` | `export class ConfigModule` | `src/core/config/config.module` |
| `PrismaService` | `export class PrismaService` | `src/infra/database/prisma/prisma.service` |

```bash
grep -rn "export class ConfigModule" src/core/config/config.module.ts
grep -rn "export class PrismaService" src/infra/database/prisma/prisma.service.ts
```

`ConfigModule` carrega `.env.${NODE_ENV}`. Com `npm test`, o arquivo é `.env.test`, onde está `DATABASE_URL`. Sem esse import o Prisma não recebe a URL.

## Templates

Trocar `Example` / `example` pelo recurso. Colunas do `create` saem do model. Método ausente no alvo sai do arquivo.

### Use case

`src/app/example/application/usecases/create-example/create-example.service.integration.spec.ts`

```ts
import { Test } from '@nestjs/testing';
import { ExampleModule } from 'src/app/example/example.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateExample } from './create-example.service';

describe('CreateExample - Integration tests', () => {
  let sut: CreateExample;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule, ExampleModule],
    }).compile();

    sut = module.get(CreateExample);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.example.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('Happy path', () => {
    it('should persist the example and return its id', async() => {
      // Act
      const result = await sut.execute({ name: 'Eletrônicos' });

      // Assert
      expect(typeof result.id).toBe('string');
      const saved = await prisma.example.findUnique({ where: { id: result.id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Eletrônicos');
    });
  });
});
```

Use case que lança not found com a tabela vazia. Mesmo harness. O describe `Error path` entra no spec daquela classe: no describe do método quando houver mais de um, ou direto no global quando o único método é `execute`.

```ts
describe('Error path', () => {
  it('should throw ExampleNotFoundError when the id does not exist', async() => {
    // Act & Assert
    await expect(sut.execute('00000000-0000-0000-0000-000000000000')).rejects.toThrow(ExampleNotFoundError);
  });
});
```

`ExampleNotFoundError` importa do arquivo que exporta a classe. O construtor sem argumento usa `toThrow(ExampleNotFoundError)`.

### DAO

`src/app/example/infra/driven/persistence/prisma/example-prisma.dao.integration.spec.ts`

```ts
import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ExampleDaoAdapterPrisma } from './example-prisma.dao';

describe('ExampleDaoAdapterPrisma - Integration tests', () => {
  let sut: ExampleDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ExampleDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ExampleDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.example.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    describe('Happy path', () => {
      it('should return the seeded row and the total', async() => {
        // Arrange
        await prisma.example.create({ data: { name: 'Eletrônicos' } });

        // Act
        const [rows, total] = await sut.findAll({});

        // Assert
        expect(total).toBe(1);
        expect(rows).toHaveLength(1);
        expect(rows[0].name).toBe('Eletrônicos');
      });

      it('should filter by search when the query has search', async() => {
        // Arrange
        await prisma.example.create({ data: { name: 'Eletrônicos' } });
        await prisma.example.create({ data: { name: 'Livros' } });

        // Act
        const [rows, total] = await sut.findAll({ search: 'liv' });

        // Assert
        expect(total).toBe(1);
        expect(rows[0].name).toBe('Livros');
      });
    });

    describe('Edge cases', () => {
      it('should return no rows when the table is empty', async() => {
        // Act
        const [rows, total] = await sut.findAll({});

        // Assert
        expect(rows).toEqual([]);
        expect(total).toBe(0);
      });

      it('should limit the page to the query size', async() => {
        // Arrange
        await prisma.example.create({ data: { name: 'A' } });
        await prisma.example.create({ data: { name: 'B' } });

        // Act
        const [rows, total] = await sut.findAll({ page: 1, size: 1 });

        // Assert
        expect(total).toBe(2);
        expect(rows).toHaveLength(1);
      });
    });
  });

  describe('findById', () => {
    describe('Happy path', () => {
      it('should return the row seeded in the database', async() => {
        // Arrange
        const created = await prisma.example.create({ data: { name: 'Eletrônicos' } });

        // Act
        const result = await sut.findById(created.id);

        // Assert
        expect(result?.id).toBe(created.id);
        expect(result?.name).toBe('Eletrônicos');
      });
    });

    describe('Edge cases', () => {
      it('should return null when the id does not exist', async() => {
        // Act
        const result = await sut.findById('00000000-0000-0000-0000-000000000000');

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('save', () => {
    describe('Happy path', () => {
      it('should persist the row and return its id', async() => {
        // Act
        const id = await sut.save({ name: 'Eletrônicos' });

        // Assert
        const saved = await prisma.example.findUnique({ where: { id } });
        expect(saved?.name).toBe('Eletrônicos');
      });
    });
  });

  describe('edit', () => {
    describe('Happy path', () => {
      it('should update the seeded row', async() => {
        // Arrange
        const created = await prisma.example.create({ data: { name: 'Eletrônicos' } });

        // Act
        await sut.edit(created.id, { name: 'Livros' });

        // Assert
        const saved = await prisma.example.findUnique({ where: { id: created.id } });
        expect(saved?.name).toBe('Livros');
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should remove the seeded row', async() => {
        // Arrange
        const created = await prisma.example.create({ data: { name: 'Eletrônicos' } });

        // Act
        await sut.delete(created.id);

        // Assert
        const saved = await prisma.example.findUnique({ where: { id: created.id } });
        expect(saved).toBeNull();
      });
    });
  });
});
```

O `it` de `search` fica no `Happy path` e só permanece se o `findAll` do alvo filtra texto. O `it` de `page`/`size` fica no `Edge cases` e só permanece se o `findAll` pagina. DAO sem `save`, `edit` ou `delete` (DAO rico, só leitura) não ganha esses describes. Path sem `it` some.

### Repository

`src/app/example/infra/driven/persistence/prisma/example-prisma.repository.integration.spec.ts`

```ts
import { Test } from '@nestjs/testing';
import { ExampleFactory } from 'src/app/example/domain/factories/example.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ExampleRepositoryAdapterPrisma } from './example-prisma.repository';

describe('ExampleRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ExampleRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ExampleRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ExampleRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.example.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  describe('save', () => {
    describe('Happy path', () => {
      it('should persist the entity', async() => {
        // Arrange
        const entity = ExampleFactory.create({ name: 'Eletrônicos' });

        // Act
        await sut.save(entity);

        // Assert
        const saved = await prisma.example.findUnique({ where: { id: entity.props.id } });
        expect(saved?.name).toBe('Eletrônicos');
      });
    });
  });

  describe('findById', () => {
    describe('Happy path', () => {
      it('should load the seeded row through the factory', async() => {
        // Arrange
        const created = await prisma.example.create({ data: { name: 'Eletrônicos' } });

        // Act
        const result = await sut.findById(created.id);

        // Assert
        expect(result?.props.id).toBe(created.id);
        expect(result?.props.name).toBe('Eletrônicos');
      });
    });

    describe('Edge cases', () => {
      it('should return null when the id does not exist', async() => {
        // Act
        const result = await sut.findById('00000000-0000-0000-0000-000000000000');

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('edit', () => {
    describe('Happy path', () => {
      it('should update the persisted entity', async() => {
        // Arrange
        const entity = ExampleFactory.create({ name: 'Eletrônicos' });
        await sut.save(entity);
        const edited = ExampleFactory.load({ id: entity.props.id, name: 'Livros' });

        // Act
        await sut.edit(edited);

        // Assert
        const saved = await prisma.example.findUnique({ where: { id: entity.props.id } });
        expect(saved?.name).toBe('Livros');
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should remove the persisted entity', async() => {
        // Arrange
        const entity = ExampleFactory.create({ name: 'Eletrônicos' });
        await sut.save(entity);

        // Act
        await sut.delete(entity.props.id);

        // Assert
        const saved = await prisma.example.findUnique({ where: { id: entity.props.id } });
        expect(saved).toBeNull();
      });
    });
  });
});
```

`ExampleFactory.create` e `ExampleFactory.load` trocam pelo método que a factory do módulo já expõe. Argumentos são as props que essa factory pede. Não inventar método de factory.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `*.spec.ts` unitário com mock | Skill `writing-unit-tests` |
| Controller | Skill `creating-controllers`; spec unitário, se a scaffold pedir, `writing-unit-tests` |
| Entidade, factory, enum, DTO | Skills de domínio; spec unitário, se a scaffold pedir, `writing-unit-tests` |
| Teste HTTP ponta a ponta | Fora (sem skill) |
| `ConfigModule`, `PrismaService` | Kernel. Ausente: parar |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Use case em `<acao>.service.integration.spec.ts`; DAO ou repository em `*.integration.spec.ts` ao lado do adapter
- [ ] Use case importa `ConfigModule` e `XxxModule`; adapter importa `ConfigModule` e registra a classe mais `PrismaService`
- [ ] `beforeAll` uma vez, `beforeEach` com `deleteMany`, `afterAll` com `$disconnect`
- [ ] Sem `createMock`, sem spy no Prisma, sem spec unitário de DAO ou repository
- [ ] Paths na ordem `Happy path` → `Error path` → `Edge cases`; path vazio omitido
- [ ] Com inventário de `inventorying-test-scenarios`, o arquivo contém só a seção de integração, sem cenário a mais nem a menos. Sem inventário: happy path com linha real em cada método público (`search` só se filtra); error path com not found do use case e qualquer outro `throw`; edge cases com leitura vazia ou `null` e paginação só se o método pagina
- [ ] Sem `it('should be defined')`
- [ ] AAA, `sut`, `async()` sem espaço antes do `(`
- [ ] `npm test -- <arquivo>.integration.spec.ts` passou, ou a falha de banco foi reportada sem trocar para mock
- [ ] Código de produção não foi alterado (ou o bug foi reportado)
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
