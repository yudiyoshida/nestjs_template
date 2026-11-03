# Query

Leia este arquivo quando for escrever a query.

Trocar `Example` / `example` pelo recurso. Porta `IExampleDao`, token `TOKENS.ExampleDao`. Vale para módulo anêmico e rico. Devolve DTO. Sem repository e sem entidade.

`src/app/example/application/usecases/find-all-example/find-all-example.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { ExampleDto } from 'src/app/example/application/dtos/example.dto';
import { FindAllExampleQueryDto } from 'src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Injectable()
export class FindAllExample {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(query: FindAllExampleQueryDto): Promise<IPagination<ExampleDto>> {
    const [items, total] = await this.exampleDao.findAll(query);

    return new Pagination(items, total, query.page, query.size).getDto();
  }
}
```

`findById` exposto por HTTP. `src/app/example/application/usecases/find-example-by-id/find-example-by-id.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import { ExampleDto } from 'src/app/example/application/dtos/example.dto';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import { ExampleNotFoundError } from 'src/app/example/domain/errors/example-not-found.error';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class FindExampleById {
  constructor(
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(id: string): Promise<ExampleDto> {
    const item = await this.exampleDao.findById(id);
    if (!item) {
      throw new ExampleNotFoundError();
    }

    return item;
  }
}
```

O mesmo arquivo, quando o use case não é exposto por HTTP, devolve a porta inclusive `null`:

```ts
public async execute(id: string): Promise<ExampleDto | null> {
  return this.exampleDao.findById(id);
}
```
