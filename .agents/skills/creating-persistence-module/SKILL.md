---
name: creating-persistence-module
description: Cria o XxxPersistenceModule que liga TOKENS.XxxDao (e, no módulo rico, TOKENS.XxxRepository) ao adapter Prisma e exporta esses providers. Use quando o usuário pedir para criar módulo de persistência, XxxPersistenceModule, registrar DAO ou repository no Nest, provide do token de persistência ou useClass do adapter Prisma.
---

# Módulo de persistência

Cria a classe `XxxPersistenceModule`, que importa `DatabaseModule`, registra o adapter Prisma no token e exporta esses providers.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de módulo de persistência.** Todo o padrão — `adapters` com `provide`/`useClass`, `imports`/`providers`/`exports`, caminho do adapter, classe do adapter, import absoluto, module sem comentário — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada

Exceção: usuário apontar um arquivo, ou pedir edição de um module de persistência que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar anêmico (só XxxDao) ou rico (XxxDao e XxxRepository)
- [ ] 2. Escrever seguindo o template
- [ ] 3. Checklist de entrega
```

No passo 2, module novo sai do template. Edição de module que já existe: alterar só o que o pedido pede, no arquivo indicado.

## Quando usar

| Sintoma | Ação |
|---------|------|
| CRUD sem invariante que o objeto precise proteger, ou módulo interno sem agregado | Template "Anêmico" |
| Estado inválido não pode existir (entidade + factory) | Template "Rico" |
| Pedido nomeia `XxxPersistenceModule`, registro do DAO ou do repository no Nest, `provide` do token ou `useClass` do adapter Prisma | Template da forma do módulo |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Interface `IXxxDao` / `IXxxRepository` ou chave nova em `TOKENS` | Skill `creating-persistence-ports` |
| Corpo do adapter Prisma | Skill `implementing-prisma-adapters` |
| Model Prisma | Skill `writing-prisma-model` |
| `<modulo>.module.ts` que importa este module, ou import em `AppModule` | Skill `scaffolding-anemic-module`, `scaffolding-rich-module` ou `scaffolding-internal-module` |
| Use case | Skill `creating-use-case` |
| Recriar `DatabaseModule` | Fora (sem skill). Esta skill só importa |

## Lei

- Classe do module: `XxxPersistenceModule`.
- Arquivo: `src/app/<modulo>/application/persistence/<modulo>-persistence.module.ts`.
- `const adapters: Provider[]` com `{ provide, useClass }`.
- `@Module`: `imports: [DatabaseModule]`, `providers: [...adapters]`, `exports: [...adapters]`.
- `DatabaseModule` importa de `src/infra/database/database.module`.
- `TOKENS` importa de `src/core/di/token`.
- Classe do adapter: `XxxDaoAdapterPrisma`, `XxxRepositoryAdapterPrisma`.
- Arquivo do adapter: `src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts`.
- Chave `XxxDao` / `XxxRepository`, sem `I`.
- Import absoluto `src/...`.
- Module sem comentário.
- O use case não importa a classe do adapter. O `useClass` mora neste module.
- `XxxPersistenceModule` não entra em `AppModule`.
- Módulo anêmico registra só `XxxDao`. Módulo rico registra `XxxDao` e `XxxRepository`.

Nomes:

| Peça | Forma |
|------|--------|
| Pasta do módulo | kebab, singular (`faq`, `tip`) |
| `Xxx` | mesmo nome em PascalCase (`Faq`, `Tip`) |
| Classe | `XxxPersistenceModule` |
| Arquivo | `<modulo>-persistence.module.ts` |

## Templates

Substitua `<modulo>` pelo kebab singular e `Xxx` pelo PascalCase. O corpo do adapter fica na skill `implementing-prisma-adapters`. A chave em `TOKENS` fica na skill `creating-persistence-ports`. O import abaixo é o caminho canônico desses símbolos.

### Anêmico

`src/app/<modulo>/application/persistence/<modulo>-persistence.module.ts`

```ts
import { Module, Provider } from '@nestjs/common';
import { XxxDaoAdapterPrisma } from 'src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';

const adapters: Provider[] = [
  {
    provide: TOKENS.XxxDao,
    useClass: XxxDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class XxxPersistenceModule {}
```

### Rico

`src/app/<modulo>/application/persistence/<modulo>-persistence.module.ts`

```ts
import { Module, Provider } from '@nestjs/common';
import { XxxDaoAdapterPrisma } from 'src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao';
import { XxxRepositoryAdapterPrisma } from 'src/app/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.repository';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';

const adapters: Provider[] = [
  {
    provide: TOKENS.XxxDao,
    useClass: XxxDaoAdapterPrisma,
  },
  {
    provide: TOKENS.XxxRepository,
    useClass: XxxRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class XxxPersistenceModule {}
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Porta e chave em `TOKENS` | Skill `creating-persistence-ports` |
| Corpo do adapter Prisma | Skill `implementing-prisma-adapters` |
| Model Prisma | Skill `writing-prisma-model` |
| `<modulo>.module.ts` e import em `AppModule` | Skill `scaffolding-anemic-module`, `scaffolding-rich-module` ou `scaffolding-internal-module` |
| Use case | Skill `creating-use-case` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Anêmico: só `provide: TOKENS.XxxDao` com `useClass: XxxDaoAdapterPrisma`
- [ ] Rico: `XxxDao` e `XxxRepository`, cada um com o `useClass` do adapter Prisma
- [ ] `imports: [DatabaseModule]`, `providers: [...adapters]`, `exports: [...adapters]`
- [ ] Imports absolutos `src/...`, adapter na pasta `prisma/`
- [ ] Classe `XxxPersistenceModule` no arquivo `<modulo>-persistence.module.ts`
- [ ] Module sem comentário
- [ ] `XxxPersistenceModule` fora de `AppModule`
- [ ] Porta, chave de `TOKENS`, corpo do adapter, model Prisma, `<modulo>.module.ts` e use case não foram criados aqui
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
