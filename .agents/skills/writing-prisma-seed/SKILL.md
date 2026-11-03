---
name: writing-prisma-seed
description: Escreve a classe de seed Prisma em prisma/seeds e registra a chamada no runner, fora do Nest. Use quando o usuário pedir para criar seed, escrever seed, popular o banco, dado inicial de um model, classe de seed, registrar o seed no runner ou usar db:seed.
---

# Seed Prisma

A skill escreve o arquivo de seed de um model e registra a classe no runner.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de seed Prisma.** Todo o padrão — arquivo `prisma/seeds/<kebab>.ts`, classe `XxxSeed`, `static seed`, loop `create({ data })`, runner, textos de `db:seed` e `prisma.seed`, senha via `Password`, enum pelo membro — está definido aqui e apenas aqui.

O corpo canônico está nos templates desta skill.

Antes de escrever, é proibido:

- ler arquivo existente para copiar formato
- rodar grep ou glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- model, campos e valores que o usuário indicou
- `prisma/seeds/index.ts`, só para acrescentar o registro sem apagar seed já registrado
- em `package.json`, só o script `db:seed` e a chave `prisma.seed`, e para confirmar que `schema` permanece `prisma/schema`
- arquivo que exporta `Password`, só para reusar (seção "Bloco base")
- arquivo que exporta o enum de domínio do campo, só para reusar o membro

Exceção: o usuário aponta um arquivo, ou pede edição de um arquivo que já existe — a leitura fica só nesse arquivo.

### Lei

- Fora do Nest: sem `ConfigService`, sem módulo Nest, sem provider. O seed não importa `@nestjs/common` nem `@nestjs/config`. Não há `@Injectable`, `@Module` nem token de provider.
- Classe com `static async seed(prisma: PrismaClient): Promise<void>`.
- Arquivo novo: `prisma/seeds/<kebab>.ts`. Classe `XxxSeed`. `Xxx` é o model em PascalCase. `<kebab>` é o mesmo model em kebab-case. A propriedade do client é esse model com a primeira letra minúscula (`xxx`).
- Registro no runner `prisma/seeds/index.ts`. A skill acrescenta `import { XxxSeed } from './<kebab>'` e `await XxxSeed.seed(prisma)` dentro de `main`, sem apagar seed já registrado. Se `index.ts` não existir, a skill cria o runner inteiro.
- Comando existente: `npm run db:seed`, que é `dotenv -e .env.development -- prisma db seed`.
- Chave `package.json` → `prisma.seed` = `dotenv -e .env.development -- ts-node -r tsconfig-paths/register prisma/seeds/index.ts`.
- `prisma.schema` continua `prisma/schema`. Não mover.
- Se a chave `prisma.seed` ou o script `db:seed` sumir, recriar esses textos. Não inventar outro comando nem outro entrypoint.
- `create({ data })` em loop. Sem `upsert`, sem `createMany`, sem soft delete, sem `$transaction` inventada.
- Import de código do app, a partir de `prisma/seeds/`, é relativo (`../../src/...`). Não converter para import absoluto `src/`.
- Enum de domínio: importar o enum e usar o membro (`AccountRole.ADMIN`). O valor do enum é `SCREAMING_SNAKE`. Proibido string solta no lugar do enum (`'ADMIN'`, `'Ativo'`). Não recriar o arquivo do enum. Se o enum não existir, delegar à skill `creating-domain-enum`.
- Senha, e-mail, documento e token vêm do pedido na hora e entram como literal no array `data`. No template o placeholder é `'<valor informado no pedido>'`. Não ler `process.env` nem `ConfigService` para esses campos. Não inventar valor e não reaproveitar valor de outro seed.
- Se o model tem senha, o campo usa `new Password('<valor informado no pedido>').value`. `Password` ausente: não recriar o value object nesta skill; delegar à skill `creating-value-objects`.
- Nested write só quando o model Prisma do pedido exige relação obrigatória no create. O template universal é o `create({ data })` plano.
- Spec não é obrigatória. Seed de script não é classe Nest. Se o usuário pedir teste, delegar à skill `writing-unit-tests`. Esta skill não inventa harness de seed.

## Fluxo

```
Progresso:
- [ ] 1. A skill confirma que o pedido é seed de script em prisma/seeds, fora do Nest
- [ ] 2. A skill toma model, campos e valores somente do pedido
- [ ] 3. Se o model tem senha, a skill localiza Password pelo export (ausente → delega creating-value-objects e não recria o VO)
- [ ] 4. Se o campo é enum de domínio, a skill localiza o enum e usa o membro (ausente → delega creating-domain-enum e não recria o enum)
- [ ] 5. A skill escreve prisma/seeds/<kebab>.ts pelo template da classe
- [ ] 6. A skill registra o seed no runner sem apagar os outros (arquivo ausente → cria o runner inteiro)
- [ ] 7. A skill confirma o script db:seed e a chave prisma.seed com o texto exato (ausentes → recria esses textos; schema permanece prisma/schema)
- [ ] 8. A skill confere o checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Usuário pede seed, dado inicial, popular tabela ou classe de seed | Escrever `prisma/seeds/<kebab>.ts` e registrar no runner |
| Usuário pede para incluir outro model no seed | Acrescentar a classe nova e a chamada no `main`, sem apagar as já registradas |
| Usuário pede `db:seed` ou `prisma db seed` | Usar `npm run db:seed` e os textos exatos do script e da chave `prisma.seed` |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Model Prisma novo | Skill `writing-prisma-model` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| Módulo Nest | Skills de scaffolding |
| Migration | Fora (sem skill). O comando de seed não é `db:migration` nem `db:reset` |
| `Password` ausente | Skill `creating-value-objects` |
| Enum de domínio ausente | Skill `creating-domain-enum` |
| Teste ou spec | Skill `writing-unit-tests`. Spec não é obrigatória para seed de script |

## Bloco base

`PrismaClient` e `Prisma` vêm de `@prisma/client`. Não são símbolo do repositório. Não há bloco base para eles.

A skill depende de `Password` somente quando o model do pedido tem senha. Localizar pela busca do export antes de escrever. Se não existir, delegar à skill `creating-value-objects`. Esta skill não recria o value object e não substitui `Password` por hash manual.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `Password` | `export class Password` | Delegar à skill `creating-value-objects`. Não recriar o VO nesta skill |

```bash
grep -rn "export class Password" src
```

O import fica relativo a `prisma/seeds/`. O caminho conhecido é o abaixo. Se o grep apontar outro arquivo, a skill usa esse arquivo, ainda em relativo (`../../src/...`). Import absoluto `src/` não entra.

```ts
import { Password } from '../../src/shared/value-objects/password/password.vo';

password: new Password('<valor informado no pedido>').value,
```

## Templates

`Xxx` / `xxx` / `<kebab>` saem do model do pedido. O array `data` leva somente as linhas e os campos informados no pedido. Várias linhas continuam no mesmo array; o loop chama `create({ data })` uma vez por linha.

### Classe

```ts
import { Prisma, PrismaClient } from '@prisma/client';

export class XxxSeed {
  private static data: Prisma.XxxCreateInput[] = [
    {
      // campos informados no pedido
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.xxx.create({ data });
    }

    console.log('Xxx seeded');
  }
}
```

Nested write (`relation.create` dentro de `data`) só entra quando o model Prisma do pedido exige relação obrigatória no create. O template universal permanece o `create({ data })` plano.

### Senha

Quando o model tem senha, o campo entra no objeto de `data` assim. O valor é o do pedido.

```ts
import { Password } from '../../src/shared/value-objects/password/password.vo';

password: new Password('<valor informado no pedido>').value,
```

E-mail, documento e token, quando o pedido os traz, também são literal do pedido:

```ts
email: '<valor informado no pedido>',
document: '<valor informado no pedido>',
token: '<valor informado no pedido>',
```

### Enum de domínio

O membro é o do enum do campo. O exemplo de forma é `AccountRole.ADMIN`: identificador do enum e membro em `SCREAMING_SNAKE`. No pedido, enum, membro e caminho são os do campo. A string solta não substitui o membro.

```ts
import { AccountRole } from '../../src/app/account/domain/enums/account-role.enum';

role: AccountRole.ADMIN,
```

O import é relativo a `prisma/seeds/`. O arquivo do enum não nasce nesta skill. Enum ausente: delegar à skill `creating-domain-enum` antes de escrever o seed.

### Runner

Forma canônica:

```ts
import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Registro do seed novo. `AdminSeed` permanece; a skill não apaga seed já registrado. `XxxSeed` entra junto:

```ts
import { PrismaClient } from '@prisma/client';
import { AdminSeed } from './admin';
import { XxxSeed } from './<kebab>';

const prisma = new PrismaClient();

async function main() {
  await AdminSeed.seed(prisma);
  await XxxSeed.seed(prisma);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

No `index.ts` que já existe, a skill acrescenta o import `./<kebab>` e o `await XxxSeed.seed(prisma)` no fim de `main`. Imports e `await` já presentes ficam, na mesma ordem. O `catch` continua relançando o erro. O `finally` continua com `prisma.$disconnect()`.

Se `prisma/seeds/index.ts` não existir, a skill cria o runner inteiro: a forma canônica mais o import e o `await` do seed novo. A skill não importa classe cujo arquivo não existe.

### Comandos

O script e a chave, quando existirem, permanecem com estes textos. Quando sumirem, a skill recria estes textos e nenhum outro. `schema` não se move.

```json
"db:seed": "dotenv -e .env.development -- prisma db seed"
```

```json
"schema": "prisma/schema",
"seed": "dotenv -e .env.development -- ts-node -r tsconfig-paths/register prisma/seeds/index.ts"
```

A execução é `npm run db:seed`. O entrypoint continua `prisma/seeds/index.ts`.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Schema Prisma, model, campo novo | Skill `writing-prisma-model` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| Use case | Skill `creating-use-case` |
| Módulo Nest, controller, provider | Skills de scaffolding |
| Value object `Password` | Skill `creating-value-objects` |
| Enum de domínio | Skill `creating-domain-enum` |
| Spec ou harness de teste | Skill `writing-unit-tests`, e só se o usuário pedir teste |
| Migration, `db:migration`, `db:reset` | Fora (sem skill) |

A skill não edita schema, não cria use case e não coloca seed dentro de módulo Nest.

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Classe `XxxSeed` com `static async seed(prisma: PrismaClient): Promise<void>`
- [ ] Arquivo `prisma/seeds/<kebab>.ts`
- [ ] `create({ data })` em loop; sem `upsert`, sem `createMany`, sem soft delete, sem `$transaction` inventada
- [ ] Registro no `index.ts` sem apagar os outros; `main` / `catch` / `finally` na forma canônica
- [ ] `index.ts` ausente: runner inteiro criado, com o seed novo e sem classe inventada
- [ ] Script `db:seed` igual a `dotenv -e .env.development -- prisma db seed`
- [ ] Chave `prisma.seed` igual a `dotenv -e .env.development -- ts-node -r tsconfig-paths/register prisma/seeds/index.ts`
- [ ] `schema` permanece `prisma/schema`
- [ ] Sem `ConfigService`, sem módulo Nest, sem provider
- [ ] Sem credencial real no template; senha, e-mail, documento e token são os do pedido, no template como `'<valor informado no pedido>'`
- [ ] Enum pelo membro importado (`AccountRole.ADMIN`); sem string solta (`'ADMIN'`, `'Ativo'`)
- [ ] Import de código do app relativo (`../../src/...`)
- [ ] Model com senha: `new Password('<valor informado no pedido>').value`
- [ ] `Password` ou enum ausente: delegado, não recriado aqui
- [ ] Spec não escrita por padrão; teste pedido delegado a `writing-unit-tests`, sem harness de seed inventado
- [ ] Schema não editado; use case não criado; seed fora de módulo Nest
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
