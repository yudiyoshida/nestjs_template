# Comando anêmico

Leia este arquivo quando for escrever o comando anêmico.

Trocar `Example` / `example` pelo recurso. Campos do input saem explícitos, sem spread do DTO. Porta `IExampleDao`, token `TOKENS.ExampleDao`. Sem factory e sem entidade.

`src/app/example/application/usecases/create-example/create-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { CreateExampleInputDto, CreateExampleOutputDto } from 'src/app/example/application/usecases/create-example/dtos/create-example.dto';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class CreateExample {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(data: CreateExampleInputDto): Promise<CreateExampleOutputDto> {
    const id = await this.exampleDao.save(data);
    return { id };
  }
}
```

Se o anêmico guarda dono, `execute(data, actorId: string)` e o `actorId` segue no objeto que `save` recebe.

Campo com formato (e-mail, CPF, CNPJ, telefone, CEP). O DTO só garante string. O use case passa o valor pelo VO antes da porta e grava o `.value` normalizado. O erro do VO escapa, sem `try/catch`. Na edição, o VO só roda quando o campo veio; campo ausente segue `undefined`, que o `update` do Prisma ignora.

```ts
import { Email } from 'src/shared/value-objects/email/email.vo';

const id = await this.exampleDao.save({
  title: data.title,
  email: new Email(data.email).value,
});
```

```ts
await this.exampleDao.edit(id, {
  title: data.title,
  email: data.email !== undefined ? new Email(data.email).value : undefined,
});
```

VO ausente: skill `creating-value-objects`.

`src/app/example/application/usecases/edit-example/edit-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { EditExampleInputDto } from 'src/app/example/application/usecases/edit-example/dtos/edit-example.dto';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class EditExample {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(id: string, data: EditExampleInputDto, actorId?: string): Promise<SuccessMessage> {
    const current = await this.exampleDao.findById(id);
    if (!current) {
      throw new ExampleNotFoundError();
    }
    if (actorId && current.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    await this.exampleDao.edit(id, data);

    return { message: 'Example atualizado com sucesso' };
  }
}
```

`src/app/example/application/usecases/delete-example/delete-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class DeleteExample {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(id: string, actorId?: string): Promise<SuccessMessage> {
    const current = await this.exampleDao.findById(id);
    if (!current) {
      throw new ExampleNotFoundError();
    }
    if (actorId && current.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    await this.exampleDao.delete(id);

    return { message: 'Example excluído com sucesso' };
  }
}
```

Status anêmico. Mesma porta. A coluna muda por `edit`. Sem método de entidade. O enum `ExampleStatus` é da skill `creating-domain-enum`.

`src/app/example/application/usecases/expire-example/expire-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { ExampleStatus } from 'src/app/example/domain/enums/example-status.enum';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class ExpireExample {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(id: string, actorId?: string): Promise<SuccessMessage> {
    const current = await this.exampleDao.findById(id);
    if (!current) {
      throw new ExampleNotFoundError();
    }
    if (actorId && current.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    await this.exampleDao.edit(id, { status: ExampleStatus.EXPIRED });

    return { message: 'Example atualizado com sucesso' };
  }
}
```
