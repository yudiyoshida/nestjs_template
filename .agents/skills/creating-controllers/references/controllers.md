# Templates de controller

Leia este arquivo quando for escrever o controller admin, o user logado ou a leitura anônima.

Trocar `Example` / `example` / `examples` pelo recurso. Tag `Examples` vira o plural do recurso, igual nas duas superfícies. Importar o use case e os DTOs que já existem. Caminho diferente do template: usar o arquivo do export. Não criar use case nem DTO aqui. Escrever só os métodos pedidos.

`@Patch` é o editar de campo opcional. Body que substitui o recurso: o mesmo método com `@Put`.

## Admin

`src/app/example/infra/drivers/http/admin/example-admin.controller.ts`

```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ExampleDto } from 'src/app/example/application/dtos/example.dto';
import { CreateExample } from 'src/app/example/application/usecases/create-example/create-example.service';
import { CreateExampleInputDto, CreateExampleOutputDto } from 'src/app/example/application/usecases/create-example/dtos/create-example.dto';
import { DeleteExample } from 'src/app/example/application/usecases/delete-example/delete-example.service';
import { EditExampleInputDto } from 'src/app/example/application/usecases/edit-example/dtos/edit-example.dto';
import { EditExample } from 'src/app/example/application/usecases/edit-example/edit-example.service';
import { FindAllExampleQueryDto } from 'src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto';
import { FindAllExample } from 'src/app/example/application/usecases/find-all-example/find-all-example.service';
import { FindExampleById } from 'src/app/example/application/usecases/find-example-by-id/find-example-by-id.service';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/examples')
@RequiredRoles(AccountRole.ADMIN)
export class ExampleAdminController {
  constructor(
    private readonly createExample: CreateExample,
    private readonly findAllExample: FindAllExample,
    private readonly findExampleById: FindExampleById,
    private readonly editExample: EditExample,
    private readonly deleteExample: DeleteExample,
  ) {}

  @Post()
  @Swagger({
    tags: ['Examples'],
    summary: 'Criar example',
    applyBadRequest: true,
    createdResponse: CreateExampleOutputDto,
  })
  public create(@Body() body: CreateExampleInputDto): Promise<CreateExampleOutputDto> {
    return this.createExample.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Examples'],
    summary: 'Listar examples',
    applyBadRequest: true,
    okPaginatedResponse: ExampleDto,
  })
  public findAll(@Query() queries: FindAllExampleQueryDto): Promise<IPagination<ExampleDto>> {
    return this.findAllExample.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Buscar example por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ExampleDto,
  })
  public findOne(@Param() params: Params): Promise<ExampleDto> {
    return this.findExampleById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Editar example',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditExampleInputDto): Promise<SuccessMessage> {
    return this.editExample.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Deletar example',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteExample.execute(params.id);
  }
}
```

## User logado

`src/app/example/infra/drivers/http/user/example-user.controller.ts`

`AccountRole.STUDENT` é placeholder. Trocar pelo papel que o pedido nomear e que já existe no enum. `applyUnprocessableEntity` no edit só permanece se o use case lança 422.

```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ExampleDto } from 'src/app/example/application/dtos/example.dto';
import { CreateExample } from 'src/app/example/application/usecases/create-example/create-example.service';
import { CreateExampleInputDto, CreateExampleOutputDto } from 'src/app/example/application/usecases/create-example/dtos/create-example.dto';
import { DeleteExample } from 'src/app/example/application/usecases/delete-example/delete-example.service';
import { EditExampleInputDto } from 'src/app/example/application/usecases/edit-example/dtos/edit-example.dto';
import { EditExample } from 'src/app/example/application/usecases/edit-example/edit-example.service';
import { FindAllExampleQueryDto } from 'src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto';
import { FindAllExample } from 'src/app/example/application/usecases/find-all-example/find-all-example.service';
import { FindExampleById } from 'src/app/example/application/usecases/find-example-by-id/find-example-by-id.service';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import type { Payload } from 'src/app/authentication/domain/types/payload.type';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { User } from 'src/app/authentication/infra/decorators/user.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('user/examples')
@RequiredRoles(AccountRole.STUDENT)
export class ExampleUserController {
  constructor(
    private readonly createExample: CreateExample,
    private readonly findAllExample: FindAllExample,
    private readonly findExampleById: FindExampleById,
    private readonly editExample: EditExample,
    private readonly deleteExample: DeleteExample,
  ) {}

  @Post()
  @Swagger({
    tags: ['Examples'],
    summary: 'Criar example',
    applyBadRequest: true,
    createdResponse: CreateExampleOutputDto,
  })
  public create(@Body() body: CreateExampleInputDto, @User() user: Payload): Promise<CreateExampleOutputDto> {
    return this.createExample.execute(body, user.sub);
  }

  @Get()
  @Swagger({
    tags: ['Examples'],
    summary: 'Listar examples',
    applyBadRequest: true,
    okPaginatedResponse: ExampleDto,
  })
  public findAll(@Query() queries: FindAllExampleQueryDto): Promise<IPagination<ExampleDto>> {
    return this.findAllExample.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Buscar example por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ExampleDto,
  })
  public findOne(@Param() params: Params): Promise<ExampleDto> {
    return this.findExampleById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Editar example',
    applyBadRequest: true,
    applyNotFound: true,
    applyUnprocessableEntity: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditExampleInputDto, @User() user: Payload): Promise<SuccessMessage> {
    return this.editExample.execute(params.id, body, user.sub);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Deletar example',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params, @User() user: Payload): Promise<SuccessMessage> {
    return this.deleteExample.execute(params.id, user.sub);
  }
}
```

## Leitura anônima

Mesmo caminho `src/app/example/infra/drivers/http/user/example-user.controller.ts`. Sem `RequiredRoles`, sem `@User()`. Só os GET pedidos. Lista e detalhe juntos só quando o pedido pede os dois.

```ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExampleDto } from 'src/app/example/application/dtos/example.dto';
import { FindAllExampleQueryDto } from 'src/app/example/application/usecases/find-all-example/dtos/find-all-example.dto';
import { FindAllExample } from 'src/app/example/application/usecases/find-all-example/find-all-example.service';
import { FindExampleById } from 'src/app/example/application/usecases/find-example-by-id/find-example-by-id.service';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('user/examples')
export class ExampleUserController {
  constructor(
    private readonly findAllExample: FindAllExample,
    private readonly findExampleById: FindExampleById,
  ) {}

  @Get()
  @Swagger({
    tags: ['Examples'],
    summary: 'Listar examples',
    applyBadRequest: true,
    okPaginatedResponse: ExampleDto,
  })
  public findAll(@Query() queries: FindAllExampleQueryDto): Promise<IPagination<ExampleDto>> {
    return this.findAllExample.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Examples'],
    summary: 'Buscar example por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ExampleDto,
  })
  public findOne(@Param() params: Params): Promise<ExampleDto> {
    return this.findExampleById.execute(params.id);
  }
}
```
