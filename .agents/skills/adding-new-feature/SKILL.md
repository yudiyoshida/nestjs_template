---
name: adding-new-feature
description: >-
  Checklist end-to-end para adicionar uma funcionalidade nova no projeto.
  Use SEMPRE que o usuário pedir uma feature do zero, um novo CRUD, um
  novo módulo, um novo recurso, ou disser "implementar X", "adicionar
  funcionalidade Y", "criar feature", "novo endpoint", "como começar X
  do zero", "fluxo completo", "feature completa", "scaffolding".
---

# Adicionando uma Nova Funcionalidade

## Contexto

Roteiro mestre para entregar uma feature nova respeitando arquitetura, convenções, autorização, testes e build.

**Referências**: FAQ (`src/app/_examples/faq/`) para CRUD simples; Tip (`src/app/_examples/tip/`) para DDD-light.

## Checklist Master — Novo Módulo

Siga **na ordem**. Marque conforme avança.

### 0. Levantamento

- [ ] Nome do módulo (kebab-case singular)
- [ ] Campos com tipos e tamanhos
- [ ] Relacionamentos (FK, cardinalidade, `onDelete`)
- [ ] Use cases: Create, Edit, Delete, FindAll, FindById?
- [ ] CRUD simples (só DAO) ou DDD (Entity + Factory + Repository)?
- [ ] Rotas admin e/ou user
- [ ] Roles necessários (`@RequiredRoles`)

### 1. Schema Prisma

- [ ] Criar `prisma/schema/<modulo>.prisma` com o model
- [ ] Campos `id` (uuid), `createdAt`, `updatedAt`
- [ ] Rodar `npm run db:migration`
- [ ] (opcional) seed em `prisma/seeds/`

➡️ Skill: **`prisma-conventions`**

### 2. Tokens DI

- [ ] Adicionar em `src/core/di/token.ts`:
  ```ts
  <ModuleName>Dao: Symbol.for('<ModuleName>Dao'),
  // se DDD:
  <ModuleName>Repository: Symbol.for('<ModuleName>Repository'),
  ```

➡️ Skill: **`dependency-injection`**

### 3. Estrutura de Pastas

- [ ] Rodar `npm run generate:module <nome>` ou criar manualmente
- [ ] `domain/errors/` (sempre)
- [ ] `domain/entities/` + `factories/` (se DDD)
- [ ] `application/dtos/`, `persistence/`, `usecases/`
- [ ] `infra/driven/persistence/`, `infra/drivers/http/`

➡️ Skill: **`module-structure`**

### 4. Domínio (se DDD)

- [ ] Entity com `_instantiate` privado
- [ ] Factory com `create`, `edit`, `load`
- [ ] Erros tipados em `domain/errors/`

➡️ Skill: **`domain-modeling`**

### 5. DTOs

- [ ] DTO de agregado em `application/dtos/<modulo>.dto.ts`
- [ ] Input/Output por use case com validação pt-BR
- [ ] Query DTO `extends Queries`

➡️ Skill: **`dto-and-validation`**

### 6. Ports e Adapters

- [ ] Interface `I<X>Dao` (sempre)
- [ ] Interface `I<X>Repository` (se DDD)
- [ ] Adapter Prisma com `<X>Select satisfies Prisma.<X>Select`
- [ ] Persistence module ligando token → adapter

➡️ Skills: **`dao-pattern`**, **`repository-pattern`**

### 7. Use Cases

- [ ] Um arquivo por verbo: `create-<x>.service.ts`, etc.
- [ ] `@Injectable()` + `execute(...)`
- [ ] Retorno em DTO ou `SuccessMessage`

➡️ Skill: **`use-case-creation`**

### 8. Controllers

- [ ] Admin: `@RequiredRoles(AccountRole.ADMIN)` + `@Swagger`
- [ ] User: público ou com role específico
- [ ] `AuthenticationGuardsModule` no imports do módulo

➡️ Skills: **`controllers-and-swagger`**, **`authentication-and-authorization`**

### 9. Module e Registro

- [ ] `<modulo>.module.ts` com imports/controllers/providers
- [ ] Importar em `src/app.module.ts`

### 10. Testes

- [ ] Controllers: `*.spec.ts` unit com `createMock`
- [ ] Use cases/DAO: `*.spec.ts` integration com `prisma.<model>.deleteMany()`
- [ ] DTOs: `*.dto.spec.ts`

➡️ Skill: **`testing-strategy`**

### 11. Validação Final

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Scaffolding

```bash
npm run generate:module <nome>
```

Implementação em `scripts/cli.ts` + `scripts/templates/`.

## Anti-Padrões

- ❌ Pular passos sem justificativa
- ❌ Entity em CRUD simples
- ❌ Claims/CASL (não existe neste template)
- ❌ `generator`/`datasource` fora de `prisma/schema/schema.prisma`
