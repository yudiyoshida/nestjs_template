# `.cursor/` — Skills, Rules e Contexto Arquitetural do nestjs_template

Esta pasta concentra a **memória arquitetural** do projeto para uso por agentes de IA (Cursor, Claude Code) e onboarding de pessoas. Tudo aqui deve ser mantido **em sincronia** com a evolução da arquitetura.

## Estrutura

```
.cursor/
├── README.md                       # Você está aqui
├── context.md                      # Passaporte arquitetural (resumo)
├── commands/
│   ├── nova-feature.md             # /nova-feature — pipeline completo de implementação
│   ├── feature-checklist.md        # /feature-checklist — checklist de entrega
│   └── qa-tdd.md                   # /qa-tdd — TDD (red-green-refactor) + qa-test-generator
├── rules/
│   └── architecture.mdc            # 10 regras arquiteturais ABSOLUTAS
└── skills/
    ├── architecture-overview/SKILL.md
    ├── module-structure/SKILL.md
    ├── use-case-creation/SKILL.md
    ├── dao-pattern/SKILL.md
    ├── repository-pattern/SKILL.md
    ├── domain-modeling/SKILL.md
    ├── dto-and-validation/SKILL.md
    ├── dependency-injection/SKILL.md
    ├── error-handling/SKILL.md
    ├── authentication-and-authorization/SKILL.md
    ├── controllers-and-swagger/SKILL.md
    ├── testing-strategy/SKILL.md
    ├── qa-test-generator/SKILL.md
    ├── gateway-adapters/SKILL.md
    ├── prisma-conventions/SKILL.md
    ├── naming-conventions/SKILL.md
    ├── adding-new-feature/SKILL.md
    ├── code-reviewer/SKILL.md
    └── frontend-integration-docs/SKILL.md
```

## Como usar

### 1) Slash command para nova funcionalidade (recomendado)

Para qualquer feature nova (CRUD, use case, rota), invoque:

```
/nova-feature
```

Esse comando (definido em `.cursor/commands/nova-feature.md`) **força** o agente a:
1. Ler `context.md`, `rules/architecture.mdc` e `skills/adding-new-feature/SKILL.md` antes de qualquer ação
2. Coletar requisitos via formulário estruturado
3. Apresentar plano detalhado de arquivos a criar/modificar
4. Aguardar sua aprovação antes de codificar
5. Carregar as skills específicas a cada passo
6. Validar com lint/test ao final

### 2) Para o agente / IA (uso livre)

Para forçar carregamento explícito numa nova sessão, abra com:

> "Leia `.cursor/context.md` e siga as regras de `.cursor/rules/architecture.mdc` antes de qualquer implementação. Use as skills em `.cursor/skills/` conforme o tópico."

### 3) Para humanos (onboarding e referência)

| Quero entender… | Leia primeiro |
|---|---|
| Visão geral do projeto | `context.md` → `skills/architecture-overview/SKILL.md` |
| Como criar um módulo CRUD novo | `skills/adding-new-feature/SKILL.md` (checklist mestre) |
| Como criar um use case | `skills/use-case-creation/SKILL.md` |
| Quando usar DAO vs Repository | `skills/dao-pattern/SKILL.md` + `skills/repository-pattern/SKILL.md` |
| Como modelar entidade rica | `skills/domain-modeling/SKILL.md` |
| Como proteger uma rota | `skills/authentication-and-authorization/SKILL.md` |
| Como fazer testes | `skills/testing-strategy/SKILL.md` |
| TDD + QA (matriz, RED/GREEN, padrões do repo) | Comando `/qa-tdd` + `skills/qa-test-generator/SKILL.md` |
| Como integrar serviço externo (Redis, Winston) | `skills/gateway-adapters/SKILL.md` |
| Convenções de nome | `skills/naming-conventions/SKILL.md` |
| Schema Prisma e migrations | `skills/prisma-conventions/SKILL.md` |
| Regras absolutas | `rules/architecture.mdc` (10 regras) |

### 4) Slash command TDD + QA (`/qa-tdd`)

Para **gerar ou estender testes** com ciclo TDD e fluxo de QA sênior:

```
/qa-tdd
```

Definição em `.cursor/commands/qa-tdd.md`.

### 5) Slash command apenas checklist (`/feature-checklist`)

Para **revisar** um PR ou **validar** o que falta contra o checklist oficial:

```
/feature-checklist
```

Definição em `.cursor/commands/feature-checklist.md`.

## Anatomia de uma SKILL.md

Cada skill tem o mesmo template:

```yaml
---
name: <nome-kebab-case>
description: >-
  Quando usar esta skill. Inclui sinônimos e variações do que o usuário
  pode dizer, para que o agente acione automaticamente.
---

# <Título>

## Contexto
## Estrutura e Localização
## Como Fazer
## Convenções Obrigatórias
## Anti-Padrões (Nunca Faça)
## Exemplo Completo
```

## Convenções de manutenção

- **Skills evoluem com a arquitetura**: ao mudar um padrão estabelecido, atualize a skill correspondente no mesmo PR
- **Não duplique regras** entre `rules/architecture.mdc` e skills: rules são absolutas e curtas; skills explicam o "como" com exemplos
- **Use code references reais** (`src/app/...`) com line ranges, não pseudo-código
- **Idioma**: pt-BR para conteúdo, en-US para identificadores e nomes de arquivos das skills
- **Versionamento**: a pasta `.cursor/` é versionada com o código (commitada)

## Mapa rápido de conceitos para localização

| Conceito | Lugar canônico no código | Skill que documenta |
|---|---|---|
| Bootstrap | `src/main.ts` | `architecture-overview` |
| Composição do app | `src/app.module.ts` | `architecture-overview` |
| Tokens DI | `src/core/di/token.ts` | `dependency-injection` |
| AppException | `src/core/filters/app.exception.ts` | `error-handling` |
| HttpExceptionFilter | `src/core/filters/http-exception/http-exception.filter.ts` | `error-handling` |
| PrismaService | `src/infra/database/prisma/prisma.service.ts` | `prisma-conventions` |
| ValidationPipe config | `src/infra/validators/class/config.ts` | `dto-and-validation` |
| @Swagger decorator | `src/infra/openapi/swagger.ts` | `controllers-and-swagger` |
| @RequiredRoles | `src/app/authentication/infra/decorators/required-role.decorator.ts` | `authentication-and-authorization` |
| AuthorizationGuard | `src/app/authentication/application/guards/authorization/authorization.guard.ts` | `authentication-and-authorization` |
| Pagination VO | `src/shared/value-objects/pagination/pagination.vo.ts` | `domain-modeling` + `use-case-creation` |
| Queries DTO base | `src/infra/validators/class/dtos/queries/queries.dto.ts` | `dto-and-validation` |
| Params DTO base | `src/infra/validators/class/dtos/params/params.dto.ts` | `dto-and-validation` |
| Decorators custom | `src/infra/validators/class/decorators/{trim,string-number}/...` | `dto-and-validation` |
| Módulo CRUD simples (referência) | `src/app/_examples/faq/` | `module-structure` |
| Módulo DDD (referência) | `src/app/_examples/tip/` | `module-structure` + `domain-modeling` + `repository-pattern` |
| CLI gerador interno | `scripts/cli.ts` + `scripts/templates/` | `adding-new-feature` |
