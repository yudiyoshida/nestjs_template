---
name: frontend-integration-docs
description: >-
  Produz documentação em docs/ para o time frontend após mudanças na API:
  resume breaking changes, payloads, erros e checklist. Use quando o usuário pedir
  doc/guia/nota de integração para o frontend, documentar mudanças de
  contrato HTTP, OpenAPI/Swagger, novos campos DTO, novos endpoints,
  ou após implementar feature que exija ajuste no app.
---

# Documentação de Integração Frontend (`docs/frontend-integracao-*.md`)

## Objetivo

Escrever **um arquivo markdown** em `docs/` que explique **o que mudou na API** e **o que o frontend deve fazer**, traduzindo impacto prático, breaking changes e passos de migração.

## Quando Aplicar

- Pedido explícito de doc para integração frontend.
- Implementação terminou e há **mudança de contrato** (path, método, body, query, resposta, erros).

**Não** criar arquivo em `docs/` se o usuário não pediu documentação.

## Convenções de Arquivo

| Item | Regra |
|---|---|
| **Pasta** | `docs/` na raiz do repositório |
| **Nome** | `frontend-integracao-<contexto>.md` (kebab-case) |
| **Título (H1)** | Frase clara em português + escopo |

## Estrutura Sugerida

1. **Introdução** — O que o doc cobre.
2. **Base URL** — Prefixo de rotas afetadas e menção a JWT quando relevante.
3. **Resumo das mudanças** — Tabela Antes/Depois ou Área/O que mudou.
4. **Detalhe por área** — Payloads, query params, respostas, `Content-Type`.
5. **Autenticação** — Rotas protegidas com `@RequiredRoles(AccountRole.ADMIN)` exigem Bearer token com role adequado.
6. **Erros / UX** — Quando esperar 400/404/409; exibir `message` do payload (`AppException`).
7. **Checklist prático para o frontend** — Lista numerada curta.

Eliminar seções que não se aplicam; não inflar com implementação interna (Prisma, nomes de classes).

## Fluxo de Trabalho

1. **Escopo** — Identificar rotas/DTOs alterados.
2. **Contrato** — Confirmar no código: controller, DTOs, decorators Swagger, guards.
3. **Redigir** — Seguir estrutura acima.
4. **Revisar** — URLs e nomes de campos **literais** como na API.

## Anti-Padrões

- Documentar só no chat sem persistir quando o usuário pediu documento.
- Duplicar o Swagger campo a campo sem valor acrescentado.
- Inventar endpoints que não existem no código.
