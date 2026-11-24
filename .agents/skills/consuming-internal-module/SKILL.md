---
name: consuming-internal-module
description: Faz um use case ou guard de um módulo usar o use case que um módulo interno exporta — import do módulo provedor, injeção pela classe, null virando erro do consumidor e uso só da superfície pública — sem tocar porta, DAO ou adapter do provedor. Use quando o usuário pedir para usar, chamar ou reaproveitar use case de outro módulo, consumir módulo interno, injetar use case de outro módulo, ligar dois módulos, ou consuming-internal-module.
---

# Consumo de módulo interno

Liga o módulo consumidor ao use case que um módulo interno exporta, sem atravessar a persistência do provedor.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de consumo entre módulos.** Todo o padrão — quem pode ser consumido, import do módulo, injeção, `null`, superfície pública, ciclo e spec — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia o consumidor ou o provedor para copiar formato
- rode grep/glob para inferir convenção
- abra skill vizinha para aprender seção ou template

Se código existente contradiz esta skill, **esta skill vence** no trecho novo.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- o `<provedor>.module.ts`, só para conferir o `exports`
- o use case exportado, só para saber a assinatura do `execute` e o retorno
- o `<consumidor>.module.ts` e a classe consumidora, só para inserir o trecho

Exceção: usuário apontar um arquivo — leia só esse arquivo.

### Leis

- **Provedor** é o módulo que exporta; **consumidor** é o que usa. Só módulo interno (sem HTTP) é provedor. Módulo com HTTP não exporta, por lei do template: use case que outro módulo precisa mora num módulo interno.
- O consumidor usa só o que está no `exports` do provedor. Use case que falta no `exports`: criar ou exportar no provedor (skills `creating-use-case` e `scaffolding-internal-module`), nunca contornar.
- O `<consumidor>.module.ts` importa o `XxxModule` do provedor, com import absoluto `src/app/<provedor>/<provedor>.module`. Sem `XxxPersistenceModule` do provedor e sem token dele.
- Injeção pela classe do use case, sem `@Inject` e sem token: `private readonly findAccountById: FindAccountById`. Token é para porta; use case de outro módulo é classe.
- Superfície pública do provedor: use cases exportados, read models (`application/dtos`), enums e value objects do domínio dele. Proibido importar porta, DAO, repository, adapter, entidade, factory ou módulo de persistência do provedor.
- O use case do módulo interno devolve `null` para registro ausente. O consumidor decide: lança erro dele (classe no próprio módulo, pela skill `creating-custom-errors`) ou, no guard, devolve `false`.
- Regra sobre o dado do provedor usa o value object do provedor (`new Account(status, roles).isInactive`) e lança erro do consumidor.
- O consumidor não relê a tabela do provedor pelo DAO dele. Leitura que falta vira use case no provedor.
- Proibido import circular entre módulos (A importa B e B importa A) e `forwardRef`. Ciclo: a regra que os dois usam vai para um terceiro módulo interno.
- Leitura do provedor repetida a cada request (guard): cache pela skill `caching-a-read`.
- Spec unitário do consumidor: `createMock<FindAccountById>()` com `{ provide: FindAccountById, useValue: ... }`; a classe é o token. Spec de integração importa o módulo do consumidor, que traz o do provedor.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o provedor é módulo interno e exporta o use case (ausente → creating-use-case e scaffolding-internal-module no provedor)
- [ ] 2. Importar o módulo do provedor no módulo consumidor
- [ ] 3. Injetar a classe do use case e tratar o null pelo caso (erro do consumidor ou false no guard)
- [ ] 4. Erro do consumidor ausente → creating-custom-errors
- [ ] 5. inventorying-test-scenarios na classe consumidora; depois as skills de spec
- [ ] 6. verifying-delivery e checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Use case de um módulo precisa de dado que outro módulo guarda | Fluxo inteiro |
| Guard precisa de dado de outro módulo | Fluxo inteiro, com `null` virando `false` |
| Módulo novo vai consumir um módulo interno existente | Fluxo, depois da scaffold do consumidor |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Criar o módulo interno provedor | Skill `scaffolding-internal-module` |
| Use case que falta no provedor | Skill `creating-use-case`, no provedor |
| Consumir módulo com HTTP | Fora: a regra comum vira módulo interno, pela skill `scaffolding-internal-module` |
| Gateway de vendor (Redis, SMTP, S3) | Skill `using-ports-and-adapters` |

## Bloco base

Localizar o módulo provedor e o use case pelo export. Ausente: parar e delegar ao provedor.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `XxxModule` do provedor | `export class XxxModule` | Skill `scaffolding-internal-module` |
| Use case no `exports` | a classe no array de `exports` do `<provedor>.module.ts` | Skills `creating-use-case` e `scaffolding-internal-module` |

```bash
grep -rn "export class XxxModule" src/app
grep -n "exports" src/app/<provedor>/<provedor>.module.ts
```

## Templates

`account` é o provedor do exemplo (módulo interno do template) e `example` é o consumidor. Trocar pelos módulos do pedido.

### Módulo consumidor

Junto dos imports que já existem:

```ts
import { AccountModule } from 'src/app/account/account.module';

@Module({
  imports: [
    AccountModule,
  ],
})
export class ExampleModule {}
```

### Use case consumidor

O registro do provedor é obrigatório para seguir: `null` vira erro do consumidor.

```ts
import { Injectable } from '@nestjs/common';
import { FindAccountById } from 'src/app/account/application/usecases/find-account-by-id/find-account-by-id.service';
import { Account } from 'src/app/account/domain/value-objects/account.vo';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ExampleOwnerInactiveError } from 'src/app/example/domain/errors/example-owner-inactive.error';
import { ExampleOwnerNotFoundError } from 'src/app/example/domain/errors/example-owner-not-found.error';

@Injectable()
export class AssignExampleOwner {
  constructor(
    private readonly findAccountById: FindAccountById,
  ) {}

  public async execute(exampleId: string, ownerId: string): Promise<SuccessMessage> {
    const owner = await this.findAccountById.execute(ownerId);
    if (!owner) {
      throw new ExampleOwnerNotFoundError();
    }
    if (new Account(owner.status, owner.roles).isInactive) {
      throw new ExampleOwnerInactiveError();
    }

    // segue pela porta do próprio módulo
  }
}
```

### Guard consumidor

`null` não lança: o guard devolve `false`.

```ts
const account = await this.findAccountById.execute(payload.sub);
if (!account) {
  return false;
}
```

### Spec unitário do consumidor

```ts
findAccountById = createMock<FindAccountById>();

const module = await Test.createTestingModule({
  providers: [
    AssignExampleOwner,
    { provide: FindAccountById, useValue: findAccountById },
  ],
}).compile();
```

Cenários que o inventário cobre: o provedor devolve o registro e o consumidor segue; devolve `null` e o consumidor lança o erro dele (ou o guard devolve `false`); a regra do value object barra o registro; o `execute` do provedor recebe o argumento certo.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Módulo interno provedor | Skill `scaffolding-internal-module` |
| Use case novo no provedor | Skill `creating-use-case` |
| Erro do consumidor | Skill `creating-custom-errors` |
| Cache da leitura do provedor | Skill `caching-a-read` |
| Specs | Skills `inventorying-test-scenarios`, `writing-unit-tests` e `writing-integration-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] O provedor é módulo interno e o use case está no `exports` dele
- [ ] O módulo consumidor importa o `XxxModule` do provedor com import absoluto; sem módulo de persistência nem token do provedor
- [ ] Injeção pela classe do use case, sem `@Inject`
- [ ] Só a superfície pública do provedor: use case, read model, enum, value object
- [ ] `null` vira erro do consumidor, ou `false` no guard
- [ ] Sem import circular e sem `forwardRef`
- [ ] Spec unitário com a classe do use case como token do mock
- [ ] `inventorying-test-scenarios` rodou na classe consumidora; `verifying-delivery` rodou
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
