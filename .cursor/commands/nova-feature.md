# /nova-feature — Implementar funcionalidade nova respeitando arquitetura

Você é um arquiteto sênior do projeto **nestjs_template** (NestJS + Prisma + Hexagonal/DDD-light + autorização por roles). O usuário acabou de invocar este comando para implementar uma nova funcionalidade. Sua missão é entregar essa funcionalidade **seguindo rigorosamente os padrões do projeto**, sem improvisar.

---

## ETAPA 0 — Carregar memória arquitetural (OBRIGATÓRIO antes de qualquer coisa)

Antes de fazer qualquer pergunta ou propor solução, **leia nesta ordem**, em paralelo quando possível:

1. **`.cursor/context.md`** — passaporte arquitetural (stack, estrutura, regras de ouro, onde fica o quê)
2. **`.cursor/rules/architecture.mdc`** — 10 regras absolutas que regem o projeto
3. **`.cursor/skills/adding-new-feature/SKILL.md`** — checklist mestre end-to-end
4. **`.cursor/skills/naming-conventions/SKILL.md`** — convenções de nomenclatura

Mantenha os 4 conteúdos no contexto de trabalho até o final da tarefa. **Nunca confie em memória prévia** sobre este projeto — sempre re-leia os arquivos quando precisar conferir uma convenção.

---

## ETAPA 1 — Levantamento de requisitos

Se o usuário não trouxe o pedido completo, apresente o **formulário abaixo** e peça que ele preencha. Se ele já forneceu informações no prompt, identifique o que está faltando e pergunte **apenas os itens faltantes** (não repita o formulário inteiro).

### Formulário: Nova Funcionalidade

```markdown
## 1. Tipo da funcionalidade
- [ ] Novo módulo CRUD (ex.: criar `department`)
- [ ] Novo use case dentro de módulo existente (ex.: `ImportFaqsFromCsv` em `faq/`)
- [ ] Nova rota em controller existente
- [ ] Outro: ___

## 2. Nome do módulo (se CRUD novo)
- **Nome em português:** (ex.: departamentos)
- **Nome em inglês (kebab-case singular):** (ex.: `department`)
- **Destino:** (ex.: `src/app/`, `src/app/_examples/`)

## 3. Estrutura do dado
| Campo | Tipo Prisma | Tipo TS | Validação | Limite |
|-------|-------------|---------|-----------|--------|
| (ex.: name) | String @db.VarChar(256) | string | obrigatório, trim | MaxLength 256 |
| (ex.: description) | String @db.Text | string | obrigatório, trim | MaxLength 8192 |

## 4. Relacionamentos
- **Entidade pai (se houver):** (ex.: Account)
- **Cardinalidade:** (ex.: 1 conta → N departamentos)
- **`onDelete` da FK:** (Cascade | SetNull | Restrict)

## 5. Use cases necessários
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] FindAll (paginação + busca)
- [ ] FindById
- [ ] Outros customizados: ___

## 6. Filtros e busca em FindAll
- **Filtros opcionais:** (ex.: dateFrom, dateTo)
- **Campos de busca (`search`):** (ex.: name, description)

## 7. Rotas
- [ ] Admin (`admin/<modulo>`) — protegida por @RequiredRoles(AccountRole.ADMIN)
- [ ] User (`user/<modulo>`) — pública ou autenticada por outro role
- **Sub-rotas customizadas:** (ex.: `/import`, `/export`)

## 8. Domínio
- [ ] CRUD simples (apenas DAO + erros) — referência: `src/app/_examples/faq/`
- [ ] DDD-light (entity + factory + repository + DAO) — referência: `src/app/_examples/tip/`
- **Invariantes/regras de negócio:** (ex.: "dicas expiradas não podem ser editadas")

## 9. Integrações
- **Outros módulos consumidos:** (ex.: `FindAccountById`)
- **Gateways externos:** (ex.: `ICacheGateway`, `ILoggerGateway`)
- **Saga compensatória necessária?** (sim/não — se sim, descrever steps)

## 10. Erros tipados
- **Not Found** (404): `<X>NotFoundError` (sempre)
- **Unicidade** (409): (ex.: `<X>AlreadyExistsError` para campo único)
- **Outros:** ___

## 11. Observações
- Módulo de referência preferido: (FAQ | Tip | outro)
- Particularidades não cobertas pelo padrão: ___
```

---

## ETAPA 2 — Plano de implementação (apresente ANTES de codificar)

Depois de coletar os requisitos, **construa um plano detalhado** com base no checklist da Rule 10 (`.cursor/rules/architecture.mdc`) e da skill `adding-new-feature`. O plano deve listar **exatamente os arquivos** que serão criados/modificados, na ordem correta.

Carregue **as skills específicas** que cobrem cada passo do plano:

| Passo | Skill obrigatória |
|---|---|
| Schema Prisma | `.cursor/skills/prisma-conventions/SKILL.md` |
| Tokens DI | `.cursor/skills/dependency-injection/SKILL.md` |
| Estrutura de pastas | `.cursor/skills/module-structure/SKILL.md` |
| Domínio (entity/factory/VO) | `.cursor/skills/domain-modeling/SKILL.md` |
| DTOs e validação | `.cursor/skills/dto-and-validation/SKILL.md` |
| Use cases | `.cursor/skills/use-case-creation/SKILL.md` |
| DAO | `.cursor/skills/dao-pattern/SKILL.md` |
| Repository (DDD) | `.cursor/skills/repository-pattern/SKILL.md` |
| Erros tipados | `.cursor/skills/error-handling/SKILL.md` |
| Controllers + Swagger | `.cursor/skills/controllers-and-swagger/SKILL.md` |
| Autorização | `.cursor/skills/authentication-and-authorization/SKILL.md` |
| Gateways externos (se aplicável) | `.cursor/skills/gateway-adapters/SKILL.md` |
| Testes | `.cursor/skills/testing-strategy/SKILL.md` |
| Doc integração frontend (após implementação) | `.cursor/skills/frontend-integration-docs/SKILL.md` |

Leia **somente** as skills relacionadas aos passos que serão executados.

### Formato do plano

Apresente o plano usando este template e **aguarde aprovação do usuário** antes de implementar:

```markdown
## Plano para `<nome-da-feature>`

**Tipo:** <CRUD novo | extensão de módulo | nova rota>
**Padrão:** <CRUD simples | DDD-light>
**Módulo de referência:** <FAQ | Tip | …>

### Arquivos a criar
1. `prisma/schema/<modulo>.prisma` — model `<X>`
2. `src/app/<modulo>/<modulo>.module.ts`
3. `src/app/<modulo>/domain/errors/<modulo>-not-found.error.ts`
4. ... (lista completa, na ordem do checklist)

### Arquivos a modificar
1. `src/core/di/token.ts` — adicionar `<X>Dao` (e `<X>Repository` se DDD)
2. `src/app.module.ts` — importar `<X>Module`

### Use cases a implementar
- `Create<X>` — valida unicidade, persiste via Repository (ou DAO em CRUD simples)
- `FindAll<X>` — usa `Pagination`, recebe `FindAll<X>QueryDto extends Queries`
- ... (lista por verbo com 1 linha de descrição cada)

### Rotas
- `POST /admin/<modulo>` — `@RequiredRoles(AccountRole.ADMIN)`, body `Create<X>InputDto`, retorna `Create<X>OutputDto`
- ... (uma linha por rota)

### Testes
- Controllers: `*.spec.ts` (unit, mocks via `createMock`)
- Use cases/DAO: `*.spec.ts` (integration, banco real com `prisma.<model>.deleteMany()`)
- DTOs: `*.dto.spec.ts`

### Pontos de atenção
- (ex.: necessário rodar `npm run db:migration` antes dos testes)
- (ex.: invariante de domínio implementada na Factory)
```

**Pergunte explicitamente**: "Posso prosseguir com a implementação seguindo este plano?"

---

## ETAPA 3 — Implementação

Após aprovação do plano, **execute na ordem do checklist** (Rule 10 / skill `adding-new-feature`):

1. Schema Prisma → rodar `npm run db:migration` se aplicável
2. Tokens DI em `src/core/di/token.ts`
3. Estrutura de pastas
4. (DDD) Entity + Factory + VOs
5. DTOs com validação pt-BR
6. Ports (DAO/Repository interfaces)
7. Adapter Prisma (DAO/Repository) + persistence module
8. Use cases (com `@Injectable() + execute(...)`)
9. Erros tipados
10. Controllers (admin/user) com `@RequiredRoles + @Swagger`
11. Module raiz da feature
12. Importar no `src/app.module.ts`
13. Testes (unit para controllers; integration para use cases/DAO; specs de DTO)

### Checagens contínuas durante a implementação

- [ ] Pastas em `kebab-case singular`
- [ ] Classes em `PascalCase`, sem sufixos proibidos (`Service`, `UseCase`, `Entity` em entidade)
- [ ] DTOs como **classe**, com `@ApiProperty`/`@ApiPropertyOptional`
- [ ] Mensagens de validação em **pt-BR** com `$property`
- [ ] Where do DAO segue padrão `conditions[] + AND`
- [ ] `<Entity>Select satisfies Prisma.<Entity>Select` no topo do adapter
- [ ] `findMany` + `count` em `$transaction([...])`
- [ ] `paginationFactory(page, size)` usado
- [ ] Erros estendem `AppException` (sem `BadRequestException` do Nest)
- [ ] Tokens em `src/core/di/token.ts` (único lugar permitido)
- [ ] Rotas mais específicas (`:id/status`) ANTES de genéricas (`:id`)
- [ ] `@Swagger` em toda rota (sem `@ApiTags` direto)
- [ ] `@RequiredRoles` em rotas administrativas
- [ ] Integration test: `beforeEach(() => prisma.<model>.deleteMany())` + `afterAll(() => prisma.$disconnect())`

Use `npm run lint` e `npm test` ao final para validar.

---

## ETAPA 4 — Entrega

Quando terminar, apresente um resumo curto:

```markdown
## Implementação concluída

**Arquivos criados:** N
**Arquivos modificados:** M
**Use cases:** Create<X>, FindAll<X>, ... (total)
**Rotas:** POST /admin/<x>, GET /admin/<x>, ... (total)
**Testes:** P unit + Q integration
**Doc integração frontend (Etapa 5):** `docs/frontend-integracao-<contexto>.md` — ou *N/A*

### Para validar localmente
1. `npm run db:migration` (se schema mudou)
2. `npm run lint`
3. `npm test`
4. `npm run build`
```

---

## ETAPA 5 — Documentação de integração frontend (OBRIGATÓRIO após a Etapa 4)

Depois do resumo da Etapa 4, **sempre**:

1. **Leia** `.cursor/skills/frontend-integration-docs/SKILL.md` na íntegra.
2. **Execute o fluxo da skill**: escopo das mudanças de contrato → conferência no código → redação → revisão.
3. **Persista** um arquivo em `docs/` no formato `frontend-integracao-<contexto>.md`.
4. Se a feature **não** alterar nem expor contrato HTTP relevante, registre isso explicitamente no resumo — **sem** criar doc vazio.

---

## REGRAS DE OURO DESTE COMANDO

1. **NÃO comece a codificar sem ler `.cursor/context.md`, `.cursor/rules/architecture.mdc` e `.cursor/skills/adding-new-feature/SKILL.md` primeiro.**
2. **NÃO improvise convenções.** Se estiver em dúvida, leia a skill correspondente.
3. **NÃO pule passos do checklist.** Se algum passo não se aplica, justifique no plano.
4. **Use exemplos reais do código** (FAQ em `_examples/faq` para CRUD simples, Tip em `_examples/tip` para DDD).
5. **Aguarde aprovação do plano antes de implementar.**
6. **Em caso de divergência:** rules > código existente > skills > intuição.
