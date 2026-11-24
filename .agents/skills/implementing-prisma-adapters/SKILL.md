---
name: implementing-prisma-adapters
description: Implementa XxxDaoAdapterPrisma e XxxRepositoryAdapterPrisma na pasta prisma do módulo. Use quando o usuário pedir para implementar adapter Prisma, DAO Prisma, repository Prisma, findAll paginado, select sensível ou mapToDto.
---

# Adapters Prisma

Implementa `XxxDaoAdapterPrisma` e, no módulo rico, `XxxRepositoryAdapterPrisma`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de adapter Prisma.** Todo o padrão — select, `paginationFactory`, `Promise.all`, `mapToDto`, `null` em `findById`, select sensível, colunas de `entity.props`, `Factory.load` — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada

Exceção: usuário apontar um arquivo, ou pedir edição de um adapter que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar anêmico (só DAO com escrita) ou rico (DAO de leitura + repository). Método sensível só se o pedido pede senha, token ou documento
- [ ] 2. Escrever seguindo o template
- [ ] 3. Checklist de entrega
```

No passo 2, arquivo novo sai do template. Edição de adapter que já existe: alterar só o que o pedido pede, no arquivo indicado.

## Quando usar

| Sintoma | Ação |
|---------|------|
| Módulo rico (entidade + factory) | Template "DAO rico" e template "Repository" |
| CRUD sem invariante, ou módulo interno sem agregado | Template "DAO anêmico" |
| Coluna `String` com cast de enum, ou data sem hora, no DAO anêmico | `mapToDto` do DAO rico em `findAll` e `findById` |
| Coluna `@db.Date` (data sem hora) | Bloco "Data sem hora" |
| Pedido pede senha, token ou documento | Bloco "Dado sensível" no DAO |
| Valor guardado em tabela relacionada (`Role.role`) | Mapa da seção "Lei" |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Interface da porta ou chave em `TOKENS` | Skill `creating-persistence-ports` |
| `XxxPersistenceModule` | Skill `creating-persistence-module` |
| Model Prisma | Skill `writing-prisma-model` |
| Entidade | Skill `creating-domain-entity` |
| Factory | Skill `creating-domain-factory` |
| Enum TypeScript | Skill `creating-domain-enum` |
| DTO | Skill `creating-application-dtos` |
| Use case | Skill `creating-use-case` |
| Spec | Skill `writing-integration-tests` |
| Recriar `PrismaService` | Fora (sem skill). Esta skill só importa |

## Lei

- Classe `XxxDaoAdapterPrisma` e `XxxRepositoryAdapterPrisma`. Arquivos em `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts`.
- `xxx` no `this.prisma.xxx` é o camelCase do model.
- `const XxxSelect = { ... } satisfies Prisma.XxxSelect`. Select padrão sem senha, token ou documento.
- `this.prisma.paginationFactory(query.page, query.size)` entrega `skip` e `take`.
- Busca: `contains` + `mode: 'insensitive'` num `OR` dos campos de texto do pedido. Filtro opcional só entra se o QueryDto tem esse campo.
- Filtro numérico ou booleano entra com `!== undefined`: `...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {})`. `false` e `0` são filtro válido. Texto, enum e id seguem por truthiness, como no template.
- `orderBy: { createdAt: 'desc' }`.
- `Promise.all` de `findMany` e `count`. Sem `prisma.$transaction`.
- `mapToDto` quando a coluna `String` precisa de cast (`as XxxStatus`) ou quando há data sem hora. Sem os dois, `findAll` devolve o payload do select.
- Data sem hora (`@db.Date`) é `string` `AAAA-MM-DD` fora do adapter. O adapter converte nos dois sentidos, pelo bloco "Data sem hora". Nenhuma outra camada converte.
- `findById` ausente devolve `null`. O adapter não lança `NotFound` e não tem regra de negócio.
- Repository: cada coluna sai de `entity.props`. Sem spread do objeto. `save` grava o `id`. `edit` usa o `id` no `where` e não o manda em `data`.
- `findById` do repository, quando acha, volta de `XxxFactory.load`.
- Delete físico: `this.prisma.xxx.delete`. Anêmico: `save` devolve `result.id`; `edit` e `delete` recebem `id` e o InputDto.
- Import absoluto `src/...`. Import de DTO, porta, enum e factory: trocar pelo arquivo que exporta o símbolo.
- Módulo anêmico não ganha repository. DAO rico não ganha `save`, `edit` nem `delete`.

Valor em tabela relacionada (`Role.role`), só nesse caso, dentro do `mapToDto`:

```ts
roles: row.roles.map(r => r.role) as XxxRole[],
```

## Templates

Substitua `<modulo>` pelo kebab singular e `Xxx` pelo PascalCase. Os campos dos blocos são a forma. No arquivo do pedido, o select, o `where`, o `mapToDto` e o `data` levam os campos daquele model.

### DAO rico

`src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`

```ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { XxxDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';
import { IXxxDao } from 'src/app/<modulo>/application/persistence/dao/<modulo>-dao.interface';
import { FindAllXxxQueryDto } from 'src/app/<modulo>/application/usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto';
import { XxxStatus } from 'src/app/<modulo>/domain/enums/<modulo>-status.enum';
import { XxxType } from 'src/app/<modulo>/domain/enums/<modulo>-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const XxxSelect = {
  id: true,
  type: true,
  title: true,
  content: true,
  status: true,
  locationId: true,
  createdBy: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.XxxSelect;

type XxxPayload = Prisma.XxxGetPayload<{ select: typeof XxxSelect }>;

@Injectable()
export class XxxDaoAdapterPrisma implements IXxxDao {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(row: XxxPayload): XxxDto {
    return {
      id: row.id,
      type: row.type as XxxType,
      title: row.title,
      content: row.content,
      status: row.status as XxxStatus,
      locationId: row.locationId,
      createdBy: row.createdBy,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public async findAll(query: FindAllXxxQueryDto): Promise<[XxxDto[], number]> {
    const pagination = this.prisma.paginationFactory(query.page, query.size);

    const where: Prisma.XxxWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.search ? {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.xxx.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: XxxSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.xxx.count({ where }),
    ]);

    return [rows.map(this.mapToDto), total];
  }

  public async findById(id: string): Promise<XxxDto | null> {
    const row = await this.prisma.xxx.findUnique({
      where: { id },
      select: XxxSelect,
    });

    if (!row) {
      return null;
    }

    return this.mapToDto(row);
  }
}
```

### DAO anêmico

`src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`

Sem cast de enum nem data sem hora, `findAll` devolve o payload do select. Com um dos dois, `findAll` e `findById` passam pelo `mapToDto` do DAO rico.

```ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { XxxDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';
import { IXxxDao } from 'src/app/<modulo>/application/persistence/dao/<modulo>-dao.interface';
import { CreateXxxInputDto } from 'src/app/<modulo>/application/usecases/create-<modulo>/dtos/create-<modulo>.dto';
import { EditXxxInputDto } from 'src/app/<modulo>/application/usecases/edit-<modulo>/dtos/edit-<modulo>.dto';
import { FindAllXxxQueryDto } from 'src/app/<modulo>/application/usecases/find-all-<modulo>/dtos/find-all-<modulo>.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const XxxSelect = {
  id: true,
  question: true,
  answer: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.XxxSelect;

@Injectable()
export class XxxDaoAdapterPrisma implements IXxxDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(query: FindAllXxxQueryDto): Promise<[XxxDto[], number]> {
    const pagination = this.prisma.paginationFactory(query.page, query.size);

    const where: Prisma.XxxWhereInput = query.search
      ? {
        OR: [
          { question: { contains: query.search, mode: 'insensitive' } },
          { answer: { contains: query.search, mode: 'insensitive' } },
        ],
      }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.xxx.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: XxxSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.xxx.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: string): Promise<XxxDto | null> {
    return this.prisma.xxx.findUnique({
      where: { id },
      select: XxxSelect,
    });
  }

  public async save(data: CreateXxxInputDto): Promise<string> {
    const result = await this.prisma.xxx.create({
      data,
    });

    return result.id;
  }

  public async edit(id: string, data: EditXxxInputDto): Promise<void> {
    await this.prisma.xxx.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.xxx.delete({
      where: { id },
    });
  }
}
```

### Dado sensível

Só quando o pedido pede senha, token ou documento. Entra no DAO (rico ou anêmico). O select padrão continua sem esses campos. `document` entra no segundo select só se o model tem essa coluna.

```ts
import { XxxWithSensitiveDataDto } from 'src/app/<modulo>/application/dtos/<modulo>.dto';

const XxxWithSensitiveDataSelect = {
  ...XxxSelect,
  password: true,
  passwordResetToken: true,
} satisfies Prisma.XxxSelect;

type XxxSensitivePayload = Prisma.XxxGetPayload<{ select: typeof XxxWithSensitiveDataSelect }>;

private mapToDtoWithSensitiveData(row: XxxSensitivePayload): XxxWithSensitiveDataDto {
  return {
    id: row.id,
    status: row.status as XxxStatus,
    email: row.email,
    password: row.password,
    passwordResetToken: row.passwordResetToken,
  };
}

public async findByIdWithSensitiveData(id: string): Promise<XxxWithSensitiveDataDto | null> {
  const row = await this.prisma.xxx.findUnique({
    where: { id },
    select: XxxWithSensitiveDataSelect,
  });

  if (!row) {
    return null;
  }

  return this.mapToDtoWithSensitiveData(row);
}
```

### Data sem hora

Só quando o model tem coluna `@db.Date`. O Prisma lê e grava `Date` à meia-noite UTC; fora do adapter, o valor é `string` `AAAA-MM-DD`. Campo obrigatório dispensa o ternário.

```ts
// leitura: mapToDto do DAO e load do repository
birthDate: row.birthDate ? row.birthDate.toISOString().slice(0, 10) : null,

// gravação no DAO anêmico: create({ data: { ...data, birthDate: ... } }), e o mesmo no update
birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00.000Z`) : data.birthDate,

// gravação no repository: a partir de entity.props
birthDate: entity.props.birthDate ? new Date(`${entity.props.birthDate}T00:00:00.000Z`) : null,
```

### Repository

`src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.repository.ts`

```ts
import { Injectable } from '@nestjs/common';
import { IXxxRepository } from 'src/app/<modulo>/application/persistence/repository/<modulo>-repository.interface';
import { Xxx } from 'src/app/<modulo>/domain/entities/<modulo>.entity';
import { XxxStatus } from 'src/app/<modulo>/domain/enums/<modulo>-status.enum';
import { XxxType } from 'src/app/<modulo>/domain/enums/<modulo>-type.enum';
import { XxxFactory } from 'src/app/<modulo>/domain/factories/<modulo>.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class XxxRepositoryAdapterPrisma implements IXxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Xxx): Promise<void> {
    await this.prisma.xxx.create({
      data: {
        id: entity.props.id,
        type: entity.props.type,
        title: entity.props.title,
        content: entity.props.content,
        status: entity.props.status,
        locationId: entity.props.locationId,
        createdBy: entity.props.createdBy,
        expiresAt: entity.props.expiresAt,
      },
    });
  }

  public async edit(entity: Xxx): Promise<void> {
    await this.prisma.xxx.update({
      where: {
        id: entity.props.id,
      },
      data: {
        type: entity.props.type,
        title: entity.props.title,
        content: entity.props.content,
        status: entity.props.status,
        locationId: entity.props.locationId,
        createdBy: entity.props.createdBy,
        expiresAt: entity.props.expiresAt,
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.xxx.delete({
      where: { id },
    });
  }

  public async findById(id: string): Promise<Xxx | null> {
    const row = await this.prisma.xxx.findUnique({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return XxxFactory.load({
      id: row.id,
      type: row.type as XxxType,
      status: row.status as XxxStatus,
      title: row.title,
      content: row.content,
      locationId: row.locationId,
      createdBy: row.createdBy,
      expiresAt: row.expiresAt,
    });
  }
}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Porta e chave em `TOKENS` | Skill `creating-persistence-ports` |
| `XxxPersistenceModule` | Skill `creating-persistence-module` |
| Model Prisma | Skill `writing-prisma-model` |
| Entidade | Skill `creating-domain-entity` |
| Factory | Skill `creating-domain-factory` |
| Enum TypeScript | Skill `creating-domain-enum` |
| DTO | Skill `creating-application-dtos` |
| Use case | Skill `creating-use-case` |
| Spec | Skill `writing-integration-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Classe `XxxDaoAdapterPrisma` em `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`
- [ ] Rico: também `XxxRepositoryAdapterPrisma`; anêmico: sem repository
- [ ] `findAll` usa `paginationFactory`, `Promise.all`, `orderBy: { createdAt: 'desc' }` e `contains` insensitive
- [ ] Filtro booleano ou numérico com `!== undefined`
- [ ] Select padrão sem senha, token ou documento
- [ ] `mapToDto` só quando há cast de enum ou data sem hora; `findById` devolve `null`
- [ ] Data sem hora: lê com `toISOString().slice(0, 10)` e grava com ``new Date(`${valor}T00:00:00.000Z`)``; fora do adapter é `string`
- [ ] Dado sensível só no segundo select e em `findByIdWithSensitiveData`, se o pedido pediu
- [ ] Repository lista `entity.props` campo a campo; `findById` presente volta de `XxxFactory.load`
- [ ] Delete físico; anêmico `save` devolve `result.id`
- [ ] Adapter sem `NotFound` e sem regra de negócio
- [ ] Porta, module, model, entidade, factory, enum, DTO, use case e spec não foram criados aqui
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
