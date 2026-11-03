# Comando rico

Leia este arquivo quando for escrever o comando rico.

Trocar `Example` / `example` pelo recurso. Campos `title` e `content` são ilustração: usar os campos que a factory pede, explícitos, sem spread do DTO. Porta `IExampleRepository`, token `TOKENS.ExampleRepository`. Create e edit passam pela factory. Status chama o método da entidade. Delete não chama método da entidade.

`src/app/example/application/usecases/create-example/create-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { CreateExampleInputDto, CreateExampleOutputDto } from 'src/app/example/application/usecases/create-example/dtos/create-example.dto';
import type { IExampleRepository } from 'src/app/example/application/persistence/repository/example-repository.interface';
import { ExampleFactory } from 'src/app/example/domain/factories/example.factory';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class CreateExample {
  constructor(
    @Inject(TOKENS.ExampleRepository) private readonly exampleRepository: IExampleRepository,
  ) {}

  public async execute(data: CreateExampleInputDto, actorId: string): Promise<CreateExampleOutputDto> {
    const entity = ExampleFactory.create({
      title: data.title,
      content: data.content,
      createdBy: actorId,
    });

    await this.exampleRepository.save(entity);

    return { id: entity.props.id };
  }
}
```

`src/app/example/application/usecases/edit-example/edit-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { EditExampleInputDto } from 'src/app/example/application/usecases/edit-example/dtos/edit-example.dto';
import type { IExampleRepository } from 'src/app/example/application/persistence/repository/example-repository.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { ExampleFactory } from 'src/app/example/domain/factories/example.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class EditExample {
  constructor(
    @Inject(TOKENS.ExampleRepository) private readonly exampleRepository: IExampleRepository,
  ) {}

  public async execute(id: string, data: EditExampleInputDto, actorId?: string): Promise<SuccessMessage> {
    const entity = await this.exampleRepository.findById(id);
    if (!entity) {
      throw new ExampleNotFoundError();
    }
    if (actorId && entity.props.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    const edited = ExampleFactory.edit(entity, data);
    await this.exampleRepository.edit(edited);

    return { message: 'Example atualizado com sucesso' };
  }
}
```

`src/app/example/application/usecases/delete-example/delete-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IExampleRepository } from 'src/app/example/application/persistence/repository/example-repository.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class DeleteExample {
  constructor(
    @Inject(TOKENS.ExampleRepository) private readonly exampleRepository: IExampleRepository,
  ) {}

  public async execute(id: string, actorId?: string): Promise<SuccessMessage> {
    const entity = await this.exampleRepository.findById(id);
    if (!entity) {
      throw new ExampleNotFoundError();
    }
    if (actorId && entity.props.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    await this.exampleRepository.delete(id);

    return { message: 'Example excluído com sucesso' };
  }
}
```

Status rico, um id, exposto por HTTP. O nome do método da entidade troca quando o pedido pede outra transição. O molde é `expire()`.

`src/app/example/application/usecases/expire-example/expire-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IExampleRepository } from 'src/app/example/application/persistence/repository/example-repository.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class ExpireExample {
  constructor(
    @Inject(TOKENS.ExampleRepository) private readonly exampleRepository: IExampleRepository,
  ) {}

  public async execute(id: string, actorId?: string): Promise<SuccessMessage> {
    const entity = await this.exampleRepository.findById(id);
    if (!entity) {
      throw new ExampleNotFoundError();
    }
    if (actorId && entity.props.createdBy !== actorId) {
      throw new ExampleNotFoundError();
    }

    entity.expire();
    await this.exampleRepository.edit(entity);

    return { message: 'Example atualizado com sucesso' };
  }
}
```
