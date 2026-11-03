---
name: choosing-module-shape
description: Escolhe o formato do módulo ou desvia para vendor, value object ou erro, antes de qualquer arquivo. Use quando o usuário pedir para criar módulo, CRUD, regra de negócio, ou quando não souber se o módulo é anêmico, rico ou interno.
---

# Escolha do formato do módulo

Escolhe um único caminho de skill antes de qualquer arquivo.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de formato de módulo.** Todo o padrão — anêmico, rico, interno, desvio para vendor, value object ou erro, lugar e proibições — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção
- abra outra skill para aprender árvore ou template
- crie arquivo em `src/`

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo. A leitura não muda o caminho.

## Fluxo

```
Progresso:
- [ ] 1. Classificar o pedido pela tabela "Quando usar"
- [ ] 2. Se HTTP ou invariante estiver ambíguo, fazer uma pergunta e parar, sem arquivo
- [ ] 3. Aplicar a prioridade e nomear uma única skill
- [ ] 4. Dizer lugar e proibições, depois parar
- [ ] 5. Checklist de entrega
```

## Quando usar

Pedido de módulo, CRUD ou regra passa aqui antes de arquivo.

| Sintoma | Caminho |
|---------|---------|
| CRUD sem invariante que o objeto precise proteger | `scaffolding-anemic-module` |
| Estado inválido não pode existir | `scaffolding-rich-module` |
| Módulo só consumido por outro, sem HTTP | `scaffolding-internal-module` |
| Redis, SMTP, S3, HTTP de terceiro | `using-ports-and-adapters` |
| Formato reutilizável (CPF, e-mail, data) | `creating-value-objects` |
| Falha de regra | `creating-custom-errors` |

Diferença que justifica o scaffold (não é lista de arquivos):

- Anêmico: CRUD HTTP sem invariante. Sem entidade, factory, repository.
- Rico: HTTP em que estado inválido não pode existir. Entidade, factory, duas portas.
- Interno: sem HTTP, consumido por outro módulo. Fora do `AppModule`.

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Formato já escolhido e o pedido é o scaffold | Skill do caminho (`scaffolding-anemic-module`, `scaffolding-rich-module` ou `scaffolding-internal-module`) |
| Pedido de um arquivo só | Skill daquele artefato, seção "Fora do escopo" |
| Documentação de produto, ADR, README | Fora (sem skill) |

## Prioridade

Dois sintomas no mesmo pedido: um caminho só, nesta ordem.

1. Não é módulo (Redis, SMTP, S3, HTTP de terceiro, formato reutilizável, ou só falha de regra) — skill pontual da tabela e pare.
2. Sem HTTP — `scaffolding-internal-module`. Invariante não troca este caminho para `scaffolding-rich-module`.
3. HTTP e estado inválido não pode existir — `scaffolding-rich-module`.
4. HTTP e CRUD sem invariante — `scaffolding-anemic-module`.

HTTP ou invariante desconhecido: uma pergunta. Sem arquivo até a resposta. Depois, um caminho só.

## Lugar

- Módulo de aplicação: `src/app/<modulo>/{domain,application,infra}`.
- `src/shared` só para conceito cross-módulo.
- `src/infra` só para vendor.
- `src/core` só para kernel.
- Módulo com HTTP entra em `AppModule`.
- Módulo sem HTTP: importado só pelo módulo que consome, `exports` dos use cases, fora do `AppModule`.

## Proibições

- Prisma no use case.
- `process.env` em código de aplicação.
- `HttpException` do Nest no domínio.
- `if` de negócio no controller.

## Fora do escopo

Esta skill não cria arquivo. O template mora na skill pontual.

| Artefato | Delegar a |
|----------|-----------|
| Entidade | Skill `creating-domain-entity` |
| Factory | Skill `creating-domain-factory` |
| Enum | Skill `creating-domain-enum` |
| Use case | Skill `creating-use-case` |
| DTO | Skill `creating-application-dtos` |
| Porta de persistência | Skill `creating-persistence-ports` |
| Módulo de persistência | Skill `creating-persistence-module` |
| Model Prisma | Skill `writing-prisma-model` |
| Adapter Prisma | Skill `implementing-prisma-adapters` |
| Controller | Skill `creating-controllers` |
| Teste unitário | Skill `writing-unit-tests` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Um caminho só, pelo nome da skill
- [ ] Nenhum arquivo de `src/` criado por esta skill
- [ ] Lugar e proibições ditos antes de delegar
- [ ] Nenhum template de arquivo copiado — apenas esta skill
