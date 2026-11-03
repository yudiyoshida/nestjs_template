---
name: creating-controllers
description: Escreve o controller HTTP do módulo, com prefixo admin ou user, RequiredRoles e o helper Swagger. Use quando o usuário pedir para criar controller, endpoint HTTP, rota admin ou user, ou CRUD HTTP.
---

# Controller HTTP

Escreve o controller HTTP do módulo, na superfície que o pedido pedir.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de controller HTTP.** Todo o padrão — prefixo, tag, verbo, `execute`, flags do `Swagger`, dono, `:id`, templates de admin, user logado e leitura anônima — está definido nesta skill: aqui e em `references/controllers.md`.

Antes de escrever, **não**:

- leia controllers existentes para copiar formato
- leia `src/infra/openapi/swagger.ts` para aprender decorator solto
- rode grep/glob para inferir URL, tag ou verbo
- abra outra skill

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- `references/controllers.md` desta skill, no passo 3, para escrever o controller
- o que o usuário indicou como entrada
- arquivo que exporta símbolo da seção "Bloco base" — só para o caminho do import e para reusar um valor de `AccountRole` que já existe
- `<modulo>.module.ts` e `src/app.module.ts` — só para registrar a classe
- use case e DTO que o método chama — só para importar o símbolo que já existe

Exceção: usuário apontar um arquivo, ou pedir edição de um controller que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar a superfície: admin, user logado ou leitura anônima. Não recriar authentication
- [ ] 2. Localizar os símbolos pelo export (seção "Bloco base")
- [ ] 3. Leia references/controllers.md antes de escrever o controller admin, o user logado ou a leitura anônima. Só os métodos que o pedido pedir
- [ ] 4. Registrar a classe no módulo; módulo HTTP novo entra no AppModule
- [ ] 5. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Controller, endpoint HTTP, rota admin ou user, CRUD HTTP | Controller desta skill, só a superfície pedida |
| Gestão do recurso | `admin/<plural>`, papel `ADMIN` na classe |
| Conta logada, mutação de dono | `user/<plural>`, papel na classe, `user.sub` nas mutações |
| Leitura anônima | `user/<plural>`, sem guard, só os GET pedidos |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Use case, `execute`, `actorId` | Skill `creating-use-case` |
| Input, output, query, read model | Skill `creating-application-dtos` |
| Erro `NotFound` ou 422 | Skill `creating-custom-errors` |
| Árvore do módulo | Skill `scaffolding-anemic-module` ou `scaffolding-rich-module` |
| Módulo sem HTTP | Skill `scaffolding-internal-module` |
| `*.spec.ts` | Skill `writing-unit-tests` |
| Login, refresh, logout, módulo `authentication` | Já existe. Não recriar. Ver "Matriz auth" |
| Filter, pipe ou interceptor novo | Fora (sem skill) |
| Collection Postman | Fora (sem skill) |

## Lei

Pasta do módulo em kebab, singular. URL em inglês, plural: pasta `faq` → `admin/faqs` e `user/faqs`. Trocar `example` / `examples` pelo recurso.

| Superfície | Prefixo | Auth | `execute` recebe |
|---|---|---|---|
| Gestão | `admin/<plural>` | `@RequiredRoles(AccountRole.ADMIN)` na classe | sem `actorId` |
| Conta logada | `user/<plural>` | `@RequiredRoles(<papel>)` na classe | `user.sub` nas mutações de dono |
| Leitura anônima | `user/<plural>` | sem guard | só query ou `params.id` |
| Login / refresh | `auth/login`, `auth/refresh` | sem guard. `@HttpCode(HttpStatus.OK)` | body |
| Logout | `auth/logout` | `@RequiredRoles()` vazio, no método | `user.sub` |

- Controller não tem `if`. Não espalha campo no argumento de `execute`. Repassa body, query ou `params.id`, e `user.sub` só na mutação de dono.
- Admin não usa `@User()`. Admin não passa `actorId`.
- User logado: lista e `GET :id` não recebem `user.sub`. Create de dono: `execute(body, user.sub)`. Edit de dono: `execute(params.id, body, user.sub)`. Delete de dono: `execute(params.id, user.sub)`. Mutação sem dono chama `execute` como o admin.
- Papel do user é um valor que já existe em `AccountRole`. Não inventar papel.
- Classe inteira logada: decorator na classe. Classe inteira pública: sem decorator. Mistura no mesmo controller: decorator só no método autenticado. Não colocar na classe se algum método é público.
- User controller leva só os endpoints do pedido. Não gerar a outra superfície.
- Body com campo opcional → `@Patch`. Body que substitui o recurso inteiro → `@Put`. Um método só. "Editar" no estilo FAQ/Tip é `PATCH`.
- Create devolve `*OutputDto` e usa `createdResponse`. Sem `@HttpCode(HttpStatus.OK)`.
- Update e delete devolvem `SuccessMessage` e usam `okResponse`.
- Lista devolve `Promise<IPagination<Dto>>` e usa `okPaginatedResponse`.
- `GET :id` devolve `Promise<Dto>`. Sem `| null`.
- `:id` usa `Params` e `params.id`. Proibido DTO novo de id.
- Import absoluto `src/...`. Método `public`. Devolve a Promise direto, sem `async`.
- Documentação só pelo helper `Swagger`. Proibido `@ApiOkResponse`, `@ApiTags`, `@ApiOperation` e os demais `@Api*` soltos no controller.
- Uma tag por módulo: nome do recurso no plural. O mesmo texto em admin e user. Sem prefixo nem sufixo de canal.

| Flag | Quando |
|---|---|
| `applyBadRequest` | body, query ou `Params` validado |
| `applyNotFound` | use case lança not found |
| `applyForbidden` | use case lança forbidden de conta. O guard não conta |
| `applyUnprocessableEntity` | use case lança erro de domínio 422. Senão, omitir |
| `createdResponse` | POST que cria |
| `okPaginatedResponse` | lista |
| `okResponse` | o resto |
| `applyConflict` / `applyUnsupportedMediaType` | só quando o use case produz esse status |

`@HttpCode(HttpStatus.OK)` só no POST que não cria.

## Bloco base

Localizar pela busca do export antes de escrever. O contrato abaixo é o que o controller chama. **Não recriar** esses arquivos. Export ausente: parar.

Papel que o pedido pede e não está em `AccountRole`: skill `creating-domain-enum`. Não acrescentar valor no enum daqui.

| Símbolo | Localizar por | Caminho |
|---------|---------------|---------|
| `Swagger` | `export function Swagger` | `src/infra/openapi/swagger.ts` |
| `RequiredRoles` | `export function RequiredRoles` | `src/app/authentication/infra/decorators/required-role.decorator.ts` |
| `User` | `export const User` | `src/app/authentication/infra/decorators/user.decorator.ts` |
| `Payload` | `export type Payload` | `src/app/authentication/domain/types/payload.type.ts` |
| `Params` | `export class Params` | `src/infra/validators/class/dtos/params/params.dto.ts` |
| `SuccessMessage` | `export class SuccessMessage` | `src/core/dtos/success-message.dto.ts` |
| `AccountRole` | `export enum AccountRole` | `src/app/account/domain/enums/account-role.enum.ts` |
| `IPagination` | `export class IPagination` | `src/shared/value-objects/pagination/pagination.vo.ts` |
| `AuthenticationGuardsModule` | `export class AuthenticationGuardsModule` | `src/app/authentication/application/guards/guards.module.ts` |

```bash
grep -rn "export function Swagger" src
grep -rn "export function RequiredRoles" src
grep -rn "export const User" src
grep -rn "export type Payload" src
grep -rn "export class Params" src
grep -rn "export class SuccessMessage" src
grep -rn "export enum AccountRole" src
grep -rn "export class IPagination" src
grep -rn "export class AuthenticationGuardsModule" src
```

```ts
export function Swagger(props: {
  tags: string[];
  summary: string;
  description?: string;
  okResponse?: unknown;
  okPaginatedResponse?: unknown;
  createdResponse?: unknown;
  applyBadRequest?: boolean;
  applyForbidden?: boolean;
  applyNotFound?: boolean;
  applyConflict?: boolean;
  applyUnprocessableEntity?: boolean;
  applyUnsupportedMediaType?: boolean;
}): MethodDecorator;

export function RequiredRoles(...roles: AccountRole[]): ClassDecorator & MethodDecorator;

export const User: ParameterDecorator;

export type Payload = {
  sub: string;
  roles: AccountRole[];
};

export class Params {
  id: string;
}

export class SuccessMessage {
  message: string;
}

export enum AccountRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
}

export class IPagination<T> {
  data: T[];
}

export class AuthenticationGuardsModule {}
```

Import `'<Símbolo>'`: usar o caminho da tabela. Se o grep achar outro arquivo, importar esse.

## Templates

Trocar `Example` / `example` / `examples` pelo recurso. Tag `Examples` vira o plural do recurso, igual nas duas superfícies. Importar o use case e os DTOs que já existem. Caminho diferente do template: usar o arquivo do export. Não criar use case nem DTO aqui. Escrever só os métodos pedidos.

`@Patch` no template de edit é o editar de campo opcional. Body que substitui o recurso: o mesmo método com `@Put`.

Leia `references/controllers.md` antes de escrever o controller admin, o user logado ou a leitura anônima.

### Mistura no mesmo controller

Leitura anônima e mutação logada no mesmo `ExampleUserController`: sem decorator na classe. `@RequiredRoles` só no método logado.

```ts
@Controller('user/examples')
export class ExampleUserController {
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

  @Post()
  @RequiredRoles(AccountRole.STUDENT)
  @Swagger({
    tags: ['Examples'],
    summary: 'Criar example',
    applyBadRequest: true,
    createdResponse: CreateExampleOutputDto,
  })
  public create(@Body() body: CreateExampleInputDto, @User() user: Payload): Promise<CreateExampleOutputDto> {
    return this.createExample.execute(body, user.sub);
  }
}
```

### Matriz auth

Não criar arquivo. Não recriar o módulo `authentication`. Login, refresh e logout já existem em `AuthenticationController`, prefixo `auth`. A forma abaixo só reconhece a matriz. Sem forgot/reset.

```ts
@Controller('auth')
export class AuthenticationController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Login com email e senha',
    applyBadRequest: true,
    applyForbidden: true,
    okResponse: SignInOutputDto,
  })
  public signIn(@Body() body: SignInInputDto): Promise<SignInOutputDto> {
    return this.signInUseCase.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Renovar access token',
    applyBadRequest: true,
    okResponse: RefreshOutputDto,
  })
  public refresh(@Body() body: RefreshInputDto): Promise<RefreshOutputDto> {
    return this.refreshUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RequiredRoles()
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Encerrar a sessão atual',
    okResponse: SuccessMessage,
  })
  public logout(@User() user: Payload): Promise<SuccessMessage> {
    return this.logoutUseCase.execute(user.sub);
  }
}
```

## Registro

`src/app/<modulo>/<modulo>.module.ts` ausente: não criar. Skill de scaffolding.

Arquivo presente: importar a classe escrita e incluí-la em `controllers`. Não reescrever o resto do módulo. Não mexer em `providers`.

`AuthenticationGuardsModule` entra em `imports` só quando algum método usa `RequiredRoles` e o import ainda não está. Controller só público não pede esse import.

```ts
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ExampleAdminController } from 'src/app/example/infra/drivers/http/admin/example-admin.controller';
import { ExampleUserController } from 'src/app/example/infra/drivers/http/user/example-user.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
  ],
  controllers: [
    ExampleAdminController,
    ExampleUserController,
  ],
})
```

Módulo novo com HTTP, fora de `src/app/_examples`, entra em `src/app.module.ts`:

```ts
import { ExampleModule } from 'src/app/example/example.module';
```

```ts
imports: [
  ExampleModule,
],
```

Módulo de `_examples` fica fora do `AppModule`.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Use case | Skill `creating-use-case` |
| DTO | Skill `creating-application-dtos` |
| Erro | Skill `creating-custom-errors` |
| Porta, módulo de persistência, adapter Prisma | Skills `creating-persistence-ports`, `creating-persistence-module`, `implementing-prisma-adapters` |
| Entidade, factory, enum | Skills `creating-domain-entity`, `creating-domain-factory`, `creating-domain-enum` |
| Árvore do módulo | Skill `scaffolding-anemic-module` ou `scaffolding-rich-module` |
| Módulo interno, sem controller | Skill `scaffolding-internal-module` |
| `*.spec.ts` | Skill `writing-unit-tests` |
| `Swagger`, `RequiredRoles`, `User`, `Params`, `SuccessMessage`, guards | Já existem. Não recriar |
| Módulo `authentication` | Já existe. Não recriar |
| Filter, pipe, interceptor, collection Postman | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Só a superfície e os métodos que o pedido pediu
- [ ] URL no plural. Tag única, igual em admin e user, sem canal
- [ ] Sem `if`. `execute` recebe body, query ou `params.id`. `user.sub` só na mutação de dono. Admin sem `actorId`
- [ ] `:id` com `Params`. Create com `createdResponse`. Update e delete com `SuccessMessage`. Lista com `okPaginatedResponse`. `GET :id` devolve `Promise<Dto>`
- [ ] Doc só com `Swagger`. Flags só as que a tabela manda
- [ ] `@Patch` para body parcial. `@Put` só quando o body substitui o recurso
- [ ] Classe em `controllers` do módulo. `AuthenticationGuardsModule` só se há `RequiredRoles`. Módulo HTTP novo no `AppModule`. `_examples` de fora
- [ ] Authentication não foi recriado
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
