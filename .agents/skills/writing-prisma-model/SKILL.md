---
name: writing-prisma-model
description: Cria o model Prisma em prisma/schema/<modelo>.prisma, com trilha, texto e enum de domínio como String. Use quando o usuário pedir para criar model Prisma, arquivo .prisma, tabela, campo de trilha, enum no schema ou tabela no lugar de enum.
---

# Model Prisma

Cria o arquivo `prisma/schema/<modelo>.prisma` com o model do módulo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de model Prisma.** Todo o padrão — arquivo por modelo, `schema.prisma` só com generator e datasource, trilha, `@db.Text`, `@db.VarChar(n)`, enum como `String`, tabela no lugar de enum — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- `prisma/schema/schema.prisma` e a chave `prisma.schema` do `package.json` — só para reusar ou inserir (seção "Bloco base")

Exceção: usuário apontar um arquivo, ou pedir edição de um `.prisma` que já existe — leia só esse arquivo. Pedido de colocar `model` dentro de `schema.prisma`: o model nasce em `prisma/schema/<modelo>.prisma`.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar model simples ou tabela no lugar de enum
- [ ] 2. Localizar schema.prisma (ausente → seção "Bloco base") e a chave prisma.schema (ausente → inserir só a chave)
- [ ] 3. Escrever seguindo o template
- [ ] 4. Checklist de entrega
```

No passo 3, arquivo novo sai do template. Edição de `.prisma` que já existe: alterar só o que o pedido pede, no arquivo indicado.

## Quando usar

| Sintoma | Ação |
|---------|------|
| CRUD ou tabela nova, sem registro que precise de coluna própria ou relação | Template "Model simples" |
| O registro tem coluna própria ou relação (`Role`, `Admin`) | Template "Tabela no lugar de enum", no arquivo do dono |
| Pedido nomeia model Prisma, arquivo `.prisma`, trilha, enum no schema ou tabela no lugar de enum | Template da forma escolhida no passo 1 |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Enum TypeScript | Skill `creating-domain-enum` |
| Porta `IXxxDao` / `IXxxRepository` ou chave em `TOKENS` | Skill `creating-persistence-ports` |
| `XxxPersistenceModule` | Skill `creating-persistence-module` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| Seed | Skill `writing-prisma-seed` |

## Lei

- Model novo vai em `prisma/schema/<modelo>.prisma`. Não entra em `schema.prisma`.
- Arquivo simples: um `model`. Nome do arquivo = kebab do módulo (`faq.prisma`, `tip.prisma`). Nome do `model` em PascalCase.
- Trilha do model simples: `id String @id @default(uuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Texto longo: `@db.Text`. Título: `@db.VarChar(n)`. Sem `n` no pedido, `256`.
- Título, texto longo e `status` só entram quando o pedido tem esse campo. A trilha entra sempre no model simples.
- Enum de domínio é coluna `String`. Sem bloco `enum` do Prisma.
- Tipo de cada coluna: tabela "Tipo do campo" abaixo.
- Campo opcional leva `?`. Lista não leva `?`; lista opcional no pedido leva `@default([])`.
- Id de outro módulo é `String` ou `String?` solto, sem `@relation`, com `@@index([campoId])`.
- `@@index([campo])` também em coluna que a lista filtra (status, booleano). Busca de texto não ganha índice.
- `@unique` numa coluna só quando o pedido disser que o valor é único. O tratamento do conflito (409) é da skill `handling-unique-constraints`.
- `@relation`, `@@unique` e `@@id` composto ficam no template "Tabela no lugar de enum".
- Nesse template, `Account` e `Role` não têm `createdAt` nem `updatedAt`. `Admin` usa `@@id([accountId])`.
- `Role` e `Admin` ficam no arquivo do dono.
- `package.json` → `prisma.schema` = `prisma/schema`. A chave `seed` permanece como está.

Tipo do campo:

| Campo | Coluna |
|---|---|
| Texto curto (título, nome) | `String @db.VarChar(n)`. Sem `n` no pedido, `256` |
| Texto longo | `String @db.Text` |
| Texto com formato (e-mail, CPF, CNPJ, telefone, CEP) | `String`. O valor gravado já vem normalizado pelo VO |
| Inteiro | `Int` |
| Dinheiro | `Int` em centavos, com a unidade no nome (`priceInCents`) |
| Booleano | `Boolean`. `@default(...)` só se o pedido der o valor |
| Data e hora | `DateTime` |
| Data sem hora (nascimento, vencimento) | `DateTime @db.Date`. Fora do adapter Prisma, é `string` `AAAA-MM-DD` |
| Id de outro módulo | `String`, com `@@index` |
| Lista de textos | `String[]` |
| Enum de domínio | `String` |
| Decimal que não é dinheiro, `Json`, objeto aninhado | Fora da receita. Parar e avisar |

## Bloco base

Localizar os dois antes de escrever. `schema.prisma` presente: não colocar `model` nele. Ausente: criar o arquivo abaixo. Chave `schema` presente: não alterar. Ausente: inserir só `"schema": "prisma/schema"`. Não recriar o `package.json`. Não remover `seed`.

| Arquivo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `schema.prisma` | `generator client` | `prisma/schema/schema.prisma` |
| chave `prisma.schema` | `"schema": "prisma/schema"` | inserir em `package.json`, dentro de `"prisma"` |

```bash
grep -n "generator client" prisma/schema/schema.prisma
grep -n "\"schema\":" package.json
```

`prisma/schema/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Chave ausente dentro de `"prisma"`:

```json
"schema": "prisma/schema"
```

Objeto `"prisma"` ausente:

```json
"prisma": {
  "schema": "prisma/schema"
}
```

## Templates

Substitua `Xxx` pelo PascalCase do model e `<modelo>` pelo kebab do módulo. Título, texto e `status` do model simples saem do arquivo quando o pedido não tem esse campo.

### Model simples

`prisma/schema/<modelo>.prisma`

```prisma
model Xxx {
  id        String   @id @default(uuid())
  title     String   @db.VarChar(256)
  content   String   @db.Text
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Outros tipos, quando o pedido tiver o campo. O `@@index` fica no fim do model:

```prisma
model Xxx {
  id           String    @id @default(uuid())
  priceInCents Int
  quantity     Int
  isPublished  Boolean
  publishedAt  DateTime?
  birthDate    DateTime? @db.Date
  categoryId   String
  tags         String[]  @default([])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([categoryId])
}
```

### Tabela no lugar de enum

Formato de dono com filhos. `Role` é o valor que virou tabela porque tem relação. `Admin` é o registro com coluna própria. Outro dono repete este desenho no arquivo `prisma/schema/<dono>.prisma`, com os nomes desse dono. Status ou tipo que é só valor permanece `String` no model dono, como `Account.status` e `Role.role`.

`prisma/schema/account.prisma`

```prisma
model Account {
  id                 String  @id @default(uuid())
  email              String  @unique
  password           String  @db.Text
  passwordResetToken String? @db.VarChar(64)
  status             String
  roles              Role[]
}

model Role {
  id        String  @id @default(uuid())
  accountId String
  account   Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  role      String

  admin Admin?

  @@unique([accountId, role])
}

model Admin {
  accountId String   @unique
  name      String
  document  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  roleId    String   @unique

  @@id([accountId])
}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Enum TypeScript | Skill `creating-domain-enum` |
| Porta e chave em `TOKENS` | Skill `creating-persistence-ports` |
| `XxxPersistenceModule` | Skill `creating-persistence-module` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| Seed | Skill `writing-prisma-seed` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Model novo está em `prisma/schema/<modelo>.prisma`
- [ ] `schema.prisma` ficou só com `generator` e `datasource`
- [ ] `prisma.schema` é `prisma/schema`; a chave `seed` não foi alterada
- [ ] Model simples tem a trilha `id`, `createdAt`, `updatedAt`
- [ ] Título usa `@db.VarChar(n)` (`256` quando o pedido não deu o `n`); texto longo usa `@db.Text`
- [ ] Enum de domínio é coluna `String`, sem bloco `enum`
- [ ] Tipo de cada coluna saiu da tabela "Tipo do campo"; dinheiro em centavos `Int`; nada de `Json`
- [ ] Id de outro módulo e coluna filtrada da lista com `@@index`; `@unique` só se o pedido disse único
- [ ] Título, texto e `status` só aparecem se o pedido tem esse campo
- [ ] `@relation`, `@@unique` e `@@id` composto só no template de tabela no lugar de enum
- [ ] Enum TypeScript, porta, module, adapter e seed não foram criados aqui
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
