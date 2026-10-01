---
name: creating-prisma-models
description: Cria e edita models Prisma em prisma/schema (arquivo por módulo, tipos de coluna, relações, índices e chaves únicas) e o seed de exemplo da raiz do agregado em prisma/seeds, e aplica o schema com prisma db push nos bancos de dev e de teste. Use quando o usuário pedir para criar, adicionar, editar ou revisar model Prisma, tabela, coluna, campo, relação, FK, chave estrangeira, índice, chave única, enum ou dinheiro no banco, Prisma model, database table, schema do banco, seed, dados iniciais ou dados de exemplo, rodar db push ou db:migration, ou quando uma feature nova precisar persistir dados no banco.
---

# Creating Prisma Models

Cria e edita models Prisma em `prisma/schema/<modulo>.prisma` e o seed da raiz do agregado em `prisma/seeds/`. Aplica o schema nos bancos de dev e de teste com `prisma db push`.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de model ou seed Prisma.**

Todo o padrão — arquivo por módulo, nomes, tipos, relações, índices, seed e comandos — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia, abra ou busque outros `prisma/schema/*.prisma` ou `prisma/seeds/*.ts` para copiar formato
- rode grep/glob por `@relation`, `@default` ou `Seed` para achar exemplo
- copie estilo legado (model sem timestamps, PK composta, import relativo no seed), mesmo que divirja desta skill

Se um model ou seed existente contradiz esta skill, **esta skill vence**.

**Permitido ler** (para executar a tarefa, não para copiar formato):

- `prisma/schema/<modulo>.prisma` do módulo alvo — só para editar model existente ou somar model ao arquivo
- `prisma/seeds/index.ts` — só para registrar o seed na ordem certa
- `src/app/<modulo>/domain/enums/` — só para importar os valores de enum no seed
- `src/shared/value-objects/` — só para gerar dado sensível do seed (ex.: hash de senha)

Exceção: usuário apontar um arquivo como referência — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o pedido é model ou seed Prisma (não DAO, não entidade de domínio, não Account/Role/Admin)
- [ ] 2. Listar os models do agregado: raiz, filhos do mesmo módulo e referências a outros módulos
- [ ] 3. Escrever ou editar prisma/schema/<modulo>.prisma (Template A)
- [ ] 4. Rodar npx prisma format
- [ ] 5. Conferir se o enum de domínio de cada campo de status/tipo existe; criar o que faltar (Fora do escopo)
- [ ] 6. Escrever o seed da raiz e registrar em prisma/seeds/index.ts (Template B)
- [ ] 7. Aplicar o schema: npm run db:migration e npm run db:migration:test
- [ ] 8. Compilar e lintar: npx tsc --noEmit -p tsconfig.build.json e npx eslint no seed
- [ ] 9. Rodar o seed (npm run db:reset) só com confirmação do usuário
- [ ] 10. Checklist de entrega
```

## Quando usar

| Critério | Significa |
|----------|-----------|
| Feature nova persiste dado | Model da raiz, models filhos e seed da raiz |
| Model existente muda | Campo, relação, índice, chave única ou tipo de coluna |
| Dev precisa de dado de exemplo | Seed da raiz em `prisma/seeds/` |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Conta, papel e perfil (`Account`, `Role`, `Admin`) | Fora (sem skill; planejada creating-account-roles) |
| Query, DAO, Repository, persistence module | Fora (sem skill; planejada creating-persistence-adapters) |
| Entidade, factory, enum de domínio | Fora (sem skill; planejada creating-domain-entities) |
| Dado de teste de integração (`make<Entidade>`) | Skill `writing-integration-tests` |
| `DATABASE_URL` e `.env.*` | Skill `using-core-config` |
| Generator e datasource (`prisma/schema/schema.prisma`), `PrismaService` | Fora (sem skill) — só com pedido do usuário |
| Migrations versionadas, schema em produção | Fora (sem skill) — o projeto usa `db push`; só com pedido do usuário |

## Estrutura de pastas

```
prisma/
  schema/
    schema.prisma          # generator + datasource; nenhum model aqui
    <modulo>.prisma        # todos os models do módulo: raiz e filhos
  seeds/
    index.ts               # main() chama os seeds na ordem das FKs
    <entidade>.ts          # <Entidade>Seed, um por raiz de agregado
```

`<modulo>` é o nome da pasta em `src/app/<modulo>/`. Model de outro módulo nunca entra no arquivo. Remover um módulo = apagar o `.prisma` e o seed dele.

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| Arquivo de schema | `<modulo>.prisma`, igual à pasta do módulo | `product.prisma` |
| Model raiz | PascalCase singular | `Product` |
| Model filho | Prefixo da raiz + nome do filho | `ProductImage` |
| Tabela e coluna | Mesmo nome do model e do campo, sem `@@map` nem `@map` | tabela `"Product"` |
| Campo | camelCase | `createdAt` |
| FK e referência | `<relacao>Id` | `productId`, `accountId` |
| Campo de relação | Nome do model em camelCase | `product` |
| Lista reversa | Plural do filho | `images` |
| Dinheiro | `<campo>InCents` | `priceInCents` |
| Arquivo de seed | `<entidade>.ts`, kebab-case | `product.ts` |
| Classe de seed | `<Entidade>Seed` | `ProductSeed` |
| Log do seed | `'<Entidades> seeded'`, em inglês | `'Products seeded'` |

## Modificadores de acesso

**Obrigatório em classe de comportamento** (classe de seed): método, getter, setter e atributo declaram `public`, `private` ou `protected` — inclusive públicos.

**Exceções (sem modificador):**

- `constructor` público — sem a palavra `public`. Parameter properties usam `private readonly` (e `@Inject` quando for token).
- Campos de classe de DTO — a classe descreve só a forma do dado.

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha, `async()` sem espaço antes do parêntese. No schema, `npx prisma format` alinha as colunas.

Módulo fictício `product` (ilustrativo — adapte nomes e imports ao alvo).

### A. Model

Raiz `Product` com o filho `ProductImage` no mesmo arquivo.

```prisma
// prisma/schema/product.prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  images ProductImage[]
}

model ProductImage {
  id        String   @id @default(uuid())
  url       String
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
}
```

### B. Seed

Um registro por valor de `ProductStatus`; a imagem entra aninhada na raiz.

```ts
// prisma/seeds/product.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { ProductStatus } from 'src/app/product/domain/enums/product-status.enum';

export class ProductSeed {
  private static readonly data: Prisma.ProductCreateInput[] = [
    {
      name: 'Caneta azul',
      status: ProductStatus.ACTIVE,
      images: {
        create: [
          { url: 'https://example.com/products/caneta-azul.png' },
        ],
      },
    },
    {
      name: 'Caderno pautado',
      status: ProductStatus.INACTIVE,
    },
  ];

  public static async seed(prisma: PrismaClient): Promise<void> {
    for (const data of this.data) {
      await prisma.product.create({ data });
    }

    console.log('Products seeded');
  }
}
```

Registro em `prisma/seeds/index.ts`: um import e uma linha em `main()`, depois dos seeds de que ele depende.

```ts
import { ProductSeed } from './product';

async function main() {
  await AdminSeed.seed(prisma);
  await ProductSeed.seed(prisma);
}
```

## Models

- Todos os models do módulo — raiz e filhos — ficam em `prisma/schema/<modulo>.prisma`. `prisma/schema/schema.prisma` só tem generator e datasource.
- `id String @id @default(uuid())` em todo model. O default cobre o DAO que cria sem id; o repository passa o id gerado no domínio. Sem PK composta, sem `autoincrement()`.
- Todo model, inclusive filho, tem `createdAt DateTime @default(now())` e `updatedAt DateTime @updatedAt`.
- Ordem: `id` → campos → FK + campo de relação → `createdAt`/`updatedAt` → linha em branco → listas reversas → linha em branco → `@@unique`/`@@index`.
- Filho leva o prefixo da raiz (`ProductImage`). O Prisma Client tem um namespace só, e o prefixo evita colisão entre módulos.
- Enum de domínio vira coluna `String`. O enum TS em `src/app/<modulo>/domain/enums/` é a única fonte dos valores; o DAO converte na leitura. **Proibido** `enum` do Prisma: ele gera um segundo tipo (`$Enums.<Nome>`) disputando com o enum de domínio.
- Chave natural do domínio (e-mail, documento, slug): `@unique`. Combinação única: `@@unique([<a>, <b>])`.
- Campo obrigatório novo em model que já tem dados: `@default(...)` ou opcional (`?`). Sem isso, o `db push` só aplica apagando dados.

Tipos de coluna:

| Dado | Tipo |
|------|------|
| Texto curto sem limite de domínio (nome, e-mail, documento) | `String` |
| Texto com limite de domínio | `String @db.VarChar(n)` — mesmo `n` validado no DTO |
| Texto livre longo (conteúdo, descrição, resposta) | `String @db.Text` |
| Status, tipo, papel | `String` (enum de domínio) |
| Dinheiro | `<campo>InCents Int` |
| Data e hora | `DateTime` |
| Valor opcional | Tipo com `?` (ex.: `DateTime?`) |
| `Json`, lista escalar (`String[]`), `Bytes`, `Float`, `Decimal` | Sem padrão no projeto — perguntar ao usuário antes |

Dinheiro nunca em `Float` nem `Decimal`: `Float` arredonda, e `Decimal` devolve `Prisma.Decimal`, que vaza para DAO e DTO. Centavos em `Int` mantêm a conta exata com `number`.

## Relações

| Caso | Forma |
|------|-------|
| Filho do agregado, mesmo módulo (1:N) | No filho: FK + campo de relação com `onDelete: Cascade`. Na raiz: lista reversa. Ver `ProductImage` no Template A |
| 1:1, mesmo módulo | Igual ao 1:N, com `@unique` na FK e reverso opcional (`image ProductImage?`) |
| N:N, mesmo módulo | Model de junção explícito: duas FKs, duas `@relation` com `onDelete: Cascade` e `@@unique([<a>Id, <b>Id])`. Nunca lista implícita nos dois lados |
| Model de outro módulo | Só `<outro>Id String`, sem `@relation` e sem campo reverso |

- **Nunca `@relation` com model de outro módulo.** O Prisma exige campo de relação nos dois models: a FK obrigaria editar o `.prisma` do outro módulo e impediria remover um módulo sem mexer no outro.
- `@@index([<x>Id])` em toda FK e referência. Exceção: coluna já coberta por `@unique` ou por `@@unique` que começa por ela. O Postgres não cria índice para FK sozinho.
- Índice de filtro ou ordenação (`status`, `createdAt`): só quando a query do DAO pedir. Quem escreve a query volta a esta skill para editar o model.

## Seeds

- Toda raiz de agregado ganha seed: 2 a 3 registros de exemplo, cobrindo cada valor dos enums de status e tipo.
- Filho não tem seed próprio: entra por `create` aninhado no registro da raiz.
- `data` tipado como `Prisma.<Model>CreateInput[]`. `seed()` faz `create` registro a registro.
- O seed roda em banco vazio (`npm run db:reset`). Sem `upsert`, sem `deleteMany`.
- Valor de enum vem do enum de domínio (`ProductStatus.ACTIVE`), nunca de string solta (`'Active'`). Valor solto diverge quando o enum muda.
- Dado fictício: nada de dado real nem segredo de verdade. Senha passa pelo VO, como no app: `new Password('123456').value` (`src/shared/value-objects/password/password.vo.ts`).
- Referência a outro módulo: buscar o id no banco dentro de `seed()` (`findFirstOrThrow`), com o seed dono registrado antes em `index.ts`. Nunca id inventado.
- Model editado: o seed da raiz acompanha. Campo obrigatório novo entra em todos os registros.
- Import de `src` pelo alias `src/...`. O comando de seed (`prisma.seed` no `package.json`) registra `tsconfig-paths`.
- O seed roda fora do Nest (script do Prisma): um `console.log('<Entidades> seeded')` no fim. Sem `ILoggerGateway`, sem `ConfigService`.

## Aplicar o schema

O projeto não tem migrations: `prisma db push` aplica o schema direto no banco e regenera o Prisma Client.

```bash
npx prisma format                          # formata e valida prisma/schema
npm run db:migration                       # banco de dev + prisma generate
npm run db:migration:test                  # banco de teste (specs de integração)
npx tsc --noEmit -p tsconfig.build.json    # src (sem specs) e prisma/seeds compilam
npx eslint prisma/seeds/<entidade>.ts      # npm run lint não cobre prisma/
```

- Banco fora do ar: `docker compose -f docker-compose.dev.yml up postgres -d`.
- `db push` avisa perda de dados (coluna renomeada ou removida, tipo trocado, campo obrigatório sem default) → **parar e avisar o usuário**. Nunca passar `--accept-data-loss` nem `--force-reset` por conta própria.
- Rodar o seed = `npm run db:reset`, que **apaga o banco de dev** e roda todos os seeds. Só com confirmação do usuário.
- `tsc` acusa erro em DAO ou Repository: o Prisma Client mudou. Corrigir só o uso do campo alterado e avisar o usuário.
- Model já usado por DAO ou Repository: rodar as specs de integração do módulo (`npm test -- src/app/<modulo>/`).

## Red flags

| Desculpa | Realidade |
|----------|-----------|
| "Uso `enum` do Prisma; fica tipado no banco" | Domínio é dono dos valores. Coluna `String` + enum de `domain/enums`. |
| "FK para o model de outro módulo garante integridade" | Acopla módulos e obriga editar o `.prisma` do outro. Só `<outro>Id` + `@@index`. |
| "`Decimal` é o tipo certo para dinheiro" | `Prisma.Decimal` vaza para DAO e DTO. `<campo>InCents Int`. |
| "Model filho não precisa de timestamps" | Todo model tem `createdAt` e `updatedAt`. |
| "`Account` não tem timestamps; sigo igual" | Legado. Esta skill vence. |
| "Ponho o model no `schema.prisma`" | Arquivo do módulo. `schema.prisma` só tem generator e datasource. |
| "`--accept-data-loss` destrava o `db push`" | Apaga dados. Parar e avisar o usuário. |
| "Rodo `db:reset` para testar o seed" | Apaga o banco de dev. Só com confirmação do usuário. |
| "`'Active'` direto no seed é mais simples" | Enum de domínio (`ProductStatus.ACTIVE`). |
| "Import relativo no seed é mais seguro" | Alias `src/...`. O comando de seed registra `tsconfig-paths`. |
| "`upsert` deixa o seed rodar duas vezes" | O seed roda em banco vazio (`npm run db:reset`). `create`. |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Entidade, factory, enum de domínio | Fora (sem skill; planejada creating-domain-entities) — enum que o seed usa e ainda não existe: criar só o arquivo do enum |
| DAO, Repository, persistence module | Fora (sem skill; planejada creating-persistence-adapters) |
| DTO | Fora (sem skill; planejada creating-dtos) |
| Value object que o seed usa | Skill `creating-value-objects` |
| Spec de integração de DAO ou use case | Skill `writing-integration-tests` |
| `Account`, `Role`, `Admin` | Fora (sem skill; planejada creating-account-roles) |
| `DATABASE_URL`, `.env.*` | Skill `using-core-config` |
| `prisma/schema/schema.prisma`, `PrismaService`, `DatabaseModule` | Fora (sem skill) — só com pedido do usuário |
| Migrations versionadas, schema em produção | Fora (sem skill) — só com pedido do usuário |
| Model ou seed legado fora deste padrão | Fora (sem skill) — refatorar só com pedido do usuário |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Pedido é model ou seed Prisma (não DAO, entidade nem `Account`/`Role`/`Admin`)
- [ ] Models do módulo em `prisma/schema/<modulo>.prisma`; `schema.prisma` intocado
- [ ] Model PascalCase singular; filho com prefixo da raiz; sem `@@map`/`@map`
- [ ] `id String @id @default(uuid())` em todo model
- [ ] `createdAt` e `updatedAt` em todo model, inclusive filho
- [ ] Campos na ordem: `id`, campos, FK + relação, timestamps, listas reversas, `@@`
- [ ] Enum de domínio como `String`; nenhum `enum` do Prisma
- [ ] Colunas pela tabela de tipos; dinheiro em `<campo>InCents Int`; tipo sem padrão perguntado ao usuário
- [ ] Filho do mesmo módulo com `@relation` + `onDelete: Cascade`; outro módulo só `<outro>Id`, sem `@relation`
- [ ] `@@index` em toda FK e referência não coberta por `@unique`/`@@unique`
- [ ] Campo obrigatório novo em model com dados tem `@default` ou é opcional
- [ ] Seed da raiz em `prisma/seeds/<entidade>.ts` com 2 a 3 registros, todos os valores de enum e filho aninhado
- [ ] Seed com enum de domínio, `Prisma.<Model>CreateInput[]`, `create`, `public static async seed` e `console.log('<Entidades> seeded')`
- [ ] Seed registrado em `prisma/seeds/index.ts` depois dos seeds de que depende
- [ ] `npx prisma format`, `npm run db:migration` e `npm run db:migration:test` sem erro
- [ ] `npx tsc --noEmit -p tsconfig.build.json` e `npx eslint` do seed sem erro
- [ ] Nenhum `--accept-data-loss`, `--force-reset` ou `npm run db:reset` sem confirmação do usuário
- [ ] Nenhum padrão copiado de outros models ou seeds do repositório — apenas esta skill
