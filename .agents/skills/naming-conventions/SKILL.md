---
name: naming-conventions
description: >-
  Convenções de nomenclatura do nestjs_template. Use ao nomear arquivos, classes,
  DTOs, tokens, use cases, erros, controllers, ou qualquer artefato novo.
---

# Convenções de Nomenclatura

## Pastas e Arquivos

| Artefato | Convenção | Exemplo |
|---|---|---|
| Pasta de módulo | kebab-case singular | `faq/`, `tip/` |
| Use case (arquivo) | `<verbo>-<modulo>.service.ts` | `create-faq.service.ts` |
| Use case (classe) | `<Verbo><Entity>` (sem sufixo Service) | `CreateFaq` |
| DTO input | `<Verbo><Entity>InputDto` | `CreateFaqInputDto` |
| DTO output | `<Verbo><Entity>OutputDto` | `CreateFaqOutputDto` |
| DTO agregado | `<modulo>.dto.ts` → `<Entity>Dto` | `faq.dto.ts` → `FaqDto` |
| Query DTO | `FindAll<Entity>QueryDto` | `FindAllFaqQueryDto` |
| DAO interface | `I<Entity>Dao` | `IFaqDao` |
| DAO adapter | `<Entity>DaoAdapterPrisma` | `FaqDaoAdapterPrisma` |
| Repository interface | `I<Entity>Repository` | `ITipRepository` |
| Repository adapter | `<Entity>RepositoryAdapterPrisma` | `TipRepositoryAdapterPrisma` |
| Erro | `<Razão>Error` | `FaqNotFoundError` |
| Controller admin | `<modulo>-admin.controller.ts` | `faq-admin.controller.ts` |
| Controller user | `<modulo>-user.controller.ts` | `faq-user.controller.ts` |
| Entity | `<modulo>.entity.ts` → classe `<Entity>` | `tip.entity.ts` → `Tip` |
| Factory | `<modulo>.factory.ts` → `<Entity>Factory` | `tip.factory.ts` → `TipFactory` |
| Persistence module | `<modulo>-persistence.module.ts` | `faq-persistence.module.ts` |
| Token DI | `<Entity>Dao`, `<Entity>Repository`, `<Categoria>Gateway` | `TOKENS.FaqDao` |

## Rotas HTTP

| Canal | Prefixo | Exemplo |
|---|---|---|
| Admin | `admin/<modulo>` | `admin/faq` |
| User/público | `user/<modulo>` ou raiz | `user/faq` |

## Testes

| Tipo | Sufixo | Describe |
|---|---|---|
| Unit (controller/guard) | `*.spec.ts` | `'<Sujeito> - Unit tests'` |
| Integration (use case/DAO) | `*.spec.ts` | `'<Sujeito> - Integration tests'` |
| DTO | `*.dto.spec.ts` | `'<Dto> - Unit tests'` |

## Idioma

- **Código** (classes, métodos, variáveis): inglês
- **Mensagens de erro/validação**: português (pt-BR)
- **Comentários**: português quando explicativos

## Anti-Padrões

- ❌ Sufixos `Service`, `UseCase` em classes de use case
- ❌ Sufixo `Entity` no nome da classe de entidade (classe é `Tip`, não `TipEntity`)
- ❌ `camelCase` em nomes de pasta
- ❌ Mensagens de erro em inglês para o usuário final
