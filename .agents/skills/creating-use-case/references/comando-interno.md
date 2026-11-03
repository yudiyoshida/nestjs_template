# Comando interno

Leia este arquivo quando for escrever o comando interno.

Trocar `Example` / `example` pelo recurso. Sem controller. Rico: DAO lista candidatos, repository carrega a entidade, ausência segue em frente, método da entidade, `edit`. Anêmico interno só chama o DAO e também não lança `NotFound` se o registro sumiu.

`src/app/example/application/usecases/expire-examples/expire-examples.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IExampleDao } from 'src/app/example/application/persistence/dao/example-dao.interface';
import type { IExampleRepository } from 'src/app/example/application/persistence/repository/example-repository.interface';
import { ExampleStatus } from 'src/app/example/domain/enums/example-status.enum';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class ExpireExamples {
  constructor(
    @Inject(TOKENS.ExampleRepository) private readonly exampleRepository: IExampleRepository,
    @Inject(TOKENS.ExampleDao) private readonly exampleDao: IExampleDao,
  ) {}

  public async execute(): Promise<void> {
    const [candidates] = await this.exampleDao.findAll({
      status: ExampleStatus.ACTIVE,
    });

    for (const item of candidates) {
      const entity = await this.exampleRepository.findById(item.id);
      if (!entity || !entity.hasExpired()) {
        continue;
      }

      entity.expire();
      await this.exampleRepository.edit(entity);
    }
  }
}
```

O filtro de `findAll` e o predicado `hasExpired()` trocam pelo que o pedido definir. Retorno `void`, salvo o pedido pedir outro. O enum `ExampleStatus` é da skill `creating-domain-enum`.
