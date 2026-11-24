---
name: auditing-template-conformance
description: Audita o código contra as leis do template em duas partes — um script de checagens exatas e aproximadas e uma leitura guiada, feita pelo agente, para o que busca de texto não decide — e entrega um relatório lei por lei, com arquivo, linha, evidência e a skill que corrige, sem corrigir nada. Use quando o usuário pedir auditoria, revisão de conformidade, checar drift, conferir se o código segue o template ou as leis, revisar um módulo ou um diff contra o padrão, ou auditing-template-conformance.
---

# Auditoria de conformidade

Confere o código contra as leis do template. O script acha o que busca de texto alcança; a leitura, feita pelo agente, decide o resto. O relatório diz, lei por lei, o que foi achado e como foi conferido.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o que auditar.** Todo o padrão — as checagens, a leitura por tipo de arquivo, o escopo, a triagem e o relatório — está definido nesta skill: aqui e em `references/checks.sh`.

Antes de auditar, **não**:

- escreva checagem nova na hora nem reescreva as do script
- abra skill vizinha para descobrir lei
- corrija arquivo

Se código existente contradiz esta skill, **esta skill vence**: é desvio.

**Permitido ler apenas para executar a tarefa:**

- a saída de `references/checks.sh`
- a seção "Drift conhecido" do `AGENTS.md`, para marcar o desvio já conhecido
- os arquivos do escopo, para triar ocorrência "verificar" e para a leitura
- a lista do `git diff --name-only`, na revisão de diff

### Leis

- A skill só lê e relata. Corrigir é outro pedido, na skill da linha.
- Duas partes, sempre as duas: o script (`references/checks.sh`, rodado na raiz, como está) e a leitura (tabela "Leitura por tipo de arquivo"). O script só lê arquivos e não imprime segredo.
- Checagem sem "verificar" no título é exata: a ocorrência é desvio. Com "verificar", é aproximada: o agente abre o arquivo e decide.
- A leitura é do agente, não do usuário. O agente abre cada arquivo do escopo e confere as leis do tipo dele. Cada lei da leitura sai no relatório com resultado e evidência: desvio (arquivo e linha), conforme (arquivo e linha que provam) ou não se aplica (o motivo).
- Fato de produto que o código não mostra (o recurso tem dono? o e-mail é essencial?) vira pergunta no relatório. Proibido decidir no lugar do usuário.
- A leitura é julgamento e pode deixar passar um caso. A evidência por lei deixa o usuário conferir por amostra, sem refazer a revisão.
- Escopo: o repositório inteiro (padrão), um módulo nomeado ou um diff. No diff, desvios e leitura ficam com os arquivos do `git diff --name-only <base>` e os ainda fora do git.
- Ocorrência listada em "Drift conhecido" do `AGENTS.md`: situação "conhecido". Confirmada e fora do `AGENTS.md`: "novo".
- Dispensa conhecida: `@relation` de `Account`, `Role` e `Admin` (tabela no lugar de enum); guard que só herda `AuthGuard` e fake sem ramo, que não têm decisão e dispensam spec; plural irregular certo na URL; nome de módulo singular terminado em "s".
- Testes, lint e build ficam com a skill `verifying-delivery`. A auditoria não roda nenhum dos três.

### Checagens do script

| Id | Lei | Corrige com |
|---|---|---|
| A1 | Prisma só no adapter de `infra/driven/persistence/prisma/` | `implementing-prisma-adapters`, `creating-use-case` |
| A2 | Aplicação injeta a porta por token; a classe do adapter só no módulo de persistência | `creating-use-case` |
| A3 | Env só pelo `ConfigService`; `process.env` só em `main.ts`, `config.module.ts` e `XxxModule.register()` | `using-core-config` |
| A4 | Erro estende `AppException`, sem exceção do Nest | `creating-custom-errors` |
| A5 | Classe de erro, sem `new AppException('texto')` | `creating-custom-errors` |
| A6 | Log só pelo `ILoggerGateway` | `using-logger` |
| B1 | Adapter em `<modulo>-prisma.dao.ts` e `<modulo>-prisma.repository.ts`, classes `XxxDaoAdapterPrisma` e `XxxRepositoryAdapterPrisma` | `implementing-prisma-adapters` |
| B2 | Classe do use case sem sufixo `Service` | `creating-use-case` |
| B3 | Use case com método público `execute` | `creating-use-case` |
| B4 | Import absoluto `src/...` em `src/app`; relativo só dentro de `domain/` do mesmo módulo (entidade, factory, value object) | A skill da peça |
| B5 | Enum `SCREAMING_SNAKE`, membro igual ao valor | `creating-domain-enum` |
| B6 | Sem enum nativo do Prisma | `writing-prisma-model` |
| B7 | Dinheiro em centavos `Int`; sem `Decimal`, `Float` e `Json` | `writing-prisma-model` |
| B8 | `@relation` só no caso tabela no lugar de enum | `writing-prisma-model` |
| B9 | Delete físico, sem soft delete | `creating-use-case`, `implementing-prisma-adapters` |
| C1 | Documentação HTTP só pelo helper `Swagger` | `creating-controllers` |
| C2 | Controller sem regra: cada método só `return this.<useCase>.execute(...)` | `creating-controllers` |
| C3 | URL `admin/<plural>` e `user/<plural>` | `creating-controllers` |
| C4 | Uma tag por módulo, sem prefixo de canal | `creating-controllers` |
| C5 | `PUT` só com body que substitui o recurso | `creating-controllers`, `creating-application-dtos` |
| D1 | Sem `PartialType` | `creating-application-dtos` |
| D2 | `Params`, `Queries` e `SuccessMessage` únicos; query estende `Queries`; sem `id`, `page`, `size` ou `search` em DTO de input ou de query | `creating-application-dtos` |
| D3 | Mensagem `$property deve ser uma string` | `creating-application-dtos` |
| D4 | Formato (e-mail, CPF, CNPJ, telefone, CEP) validado pelo VO, não pelo DTO | `creating-application-dtos`, `creating-value-objects` |
| D5 | CPF e CNPJ nunca na mensagem de erro: o filter grava a mensagem em log | `creating-custom-errors` |
| E1 | Chave de `TOKENS` sem uso sai | `removing-module` |
| E2 | Literal de cache sem leitura sai | `removing-module` |
| E3 | Model sem módulo sai ou ganha módulo | `removing-module` |
| E4 | Banco de teste separado do de desenvolvimento | `running-local-environment` |
| E5 | Spec que toca o banco é `*.integration.spec.ts` | `writing-integration-tests` |
| E6 | Arquivo de produção com o spec esperado | `inventorying-test-scenarios` e as skills de spec |
| E7 | Cada erro que o arquivo lança tem caso no spec dele | `inventorying-test-scenarios` e as skills de spec |
| M1 | Select padrão sem senha, token ou documento; leitura sensível em método que devolve `WithSensitiveData` | `implementing-prisma-adapters` |
| M3 | `findById` da porta devolve `null`; use case exposto por HTTP lança `NotFound` | `creating-use-case`, `creating-persistence-ports` |
| M4 | Edição parcial sem `{ ...atual, ...dto }`: campo ausente não sobrescreve | `creating-use-case`, `creating-domain-factory` |
| M6 | Lista: `Promise.all` de `findMany` e `count`, `paginationFactory`, porta com `[Dto[], number]`, `Pagination` no use case | `implementing-prisma-adapters`, `creating-use-case` |
| M7 | Create devolve `OutputDto` com `{ id }`; edit, update e delete devolvem `SuccessMessage` | `creating-use-case` |
| M8 | Campo único com checagem prévia por `existsBy<Campo>` | `handling-unique-constraints` |
| M9 | Escrita em recurso com leitura cacheada invalida o cache depois de gravar | `invalidating-cache-on-write` |
| M10 | Consumo entre módulos só pela superfície pública; sem import circular nem `forwardRef` | `consuming-internal-module` |
| M11 | Módulo com HTTP no `AppModule`; módulo sem HTTP fora dele, com `exports` | Scaffold do formato do módulo |
| M13 | `Date` com `@IsDate` e `@StringToDate`; número e booleano da query com `StringToNumber` e `StringToBoolean`; id de outro módulo com `@IsUUID('4')` e índice; lista com `@IsArray`; sem objeto aninhado | `creating-application-dtos`, `writing-prisma-model` |
| M14 | Pasta do módulo em kebab singular, só com `domain`, `application` e `infra` | `choosing-module-shape` |
| M15 | Token `Symbol.for('<Chave>')` com o nome da chave, sem `I` | `creating-persistence-ports` |
| M16 | Só o filter global e o `ValidationPipe` do `main.ts`; sem filter, pipe global ou interceptor novo | Fora (sem skill) |

### Leitura por tipo de arquivo

O agente abre cada arquivo do escopo e confere as leis da linha do tipo dele. M2, M5 e M12 só têm leitura; as outras linhas completam o script no que busca de texto não decide.

| Arquivo | O que conferir lendo | Ids |
|---|---|---|
| Use case com rota de user | Recurso com dono: `actorId?` no `execute`; dono errado lança o mesmo `NotFound` do recurso ausente | M2 |
| Use case de transição de status | Rico: método da entidade e `repository.edit`; anêmico: o DAO grava a coluna; delete não é status; devolve `SuccessMessage` | M5, M7 |
| Use case que envia e-mail | Envio depois da gravação; essencial propaga o erro; informativo segue só com `ExternalApiError` | M12 |
| Use case de delete | Físico, pela porta do formato: `repository.delete` no rico, `dao.delete` no anêmico | B9 |
| Use case de create ou edit | Campo com formato passa pelo VO antes da porta (anêmico) ou na factory (rico); valor único checado depois da normalização | D4, M8 |
| Use case que consome outro módulo | O use case do provedor está nos `exports` do módulo dele; `null` vira erro do consumidor | M10 |
| Controller | URL em inglês; `PATCH` com body parcial e `PUT` com body que substitui; `:id` com `Params`; `applyConflict` na rota que dá 409; rota de user passa `user.sub` ao use case com dono | C3, C5, D2, M2, M8 |
| DTO de input ou de query | Data sem hora: `string` com `@Matches` e `@IsISO8601` estrito; lista com `{ each: true }` | M13 |
| Adapter Prisma | Filtro opcional no `where` com `!== undefined`; data sem hora convertida para `Date` só aqui; delete sem coluna de soft delete com outro nome | M13, B9 |
| Schema Prisma | Dinheiro com a unidade no nome (`priceInCents`); data sem hora com `@db.Date`; lista em `String[]`; `@@index` em coluna filtrada da lista | B7, M13 |
| Entidade e factory | `edit` campo a campo, com `!== undefined`; status só por método da entidade; data comparada só via `UTCDate` | M4, M5, M13 |
| Adapter SMTP e `.hbs` | Um método por e-mail na porta; corpo dentro de `layouts/default.hbs`; `{{ }}` em dado do usuário | M12 |
| Chamada de log | Payload sem senha, token ou documento | D5 |
| `src/shared`, `src/infra`, `src/core` | Só conceito cross-módulo, vendor e kernel, nessa ordem | M14 |

## Fluxo

```
Progresso:
- [ ] 1. Fixar o escopo: repositório inteiro, um módulo ou um diff contra uma base
- [ ] 2. Rodar references/checks.sh na raiz do repositório
- [ ] 3. Triar cada ocorrência do script: conhecido, novo, ou "verificar" (abrir o arquivo e decidir)
- [ ] 4. Leitura: abrir cada arquivo do escopo e conferir as leis do tipo dele
- [ ] 5. Escrever o relatório no template: desvios, script, leitura lei por lei, perguntas
- [ ] 6. Perguntar quais desvios corrigir. A correção é outro pedido, na skill da linha
- [ ] 7. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Auditoria, conformidade, drift, "o código segue o template?" | Fluxo inteiro, repositório |
| Revisar um módulo | Fluxo inteiro, escopo no módulo |
| Revisar um diff ou uma branch contra o padrão | Fluxo inteiro, escopo no diff |
| Antes de apagar código de exemplo ou de fechar uma leva de mudanças | Fluxo inteiro, repositório |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Lint, tipos, testes e build da entrega | Skill `verifying-delivery` |
| Corrigir um desvio | A skill da linha |
| Revisão de regra de negócio ou de arquitetura | Fora (sem skill) |
| Conferir as próprias skills | Skill `validating-project-skills` |

## Templates

```bash
bash .agents/skills/auditing-template-conformance/references/checks.sh
```

Revisão de diff, para fixar o escopo:

```bash
git diff --name-only <base>
git status --porcelain --untracked-files=all
```

Relatório:

```markdown
## Auditoria — <repositório inteiro | módulo <nome> | diff contra <base>>

### Desvios

| Id | Arquivo:linha | Desvio | Situação | Corrige com |
|---|---|---|---|---|
| B5 | `src/app/account/domain/enums/account-status.enum.ts:2` | `ACTIVE = 'Ativo'` | conhecido | `creating-domain-enum` |
| M2 | `src/app/<modulo>/application/usecases/<acao>/<acao>.service.ts:<linha>` | rota de user edita sem `actorId` | novo | `creating-use-case` |

### Script

Sem ocorrência: A1, A2, A3.
Verificadas e dispensadas: B8 (`Account`, `Role` e `Admin` são tabela no lugar de enum).

### Leitura

| Id | Resultado | Evidência |
|---|---|---|
| M2 | conforme | `src/app/<modulo>/.../<acao>.service.ts:<linha>`: `actorId` comparado com `createdBy` |
| M5 | não se aplica | nenhuma transição de status no escopo |

### Perguntas

- <fato de produto que o código não mostra>

Quais desvios corrijo?
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Correção de cada desvio | A skill da linha |
| Lint, tipos, testes, build | Skill `verifying-delivery` |
| Revisão de regra de negócio ou de arquitetura | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Escopo fixado; no diff, desvios e leitura só em arquivo do diff
- [ ] `references/checks.sh` rodou como está, na raiz
- [ ] Cada ocorrência do script triada: conhecido, novo ou dispensada após abrir o arquivo
- [ ] Leitura feita em cada arquivo do escopo; cada lei da leitura com resultado e evidência
- [ ] Fato de produto que o código não mostra virou pergunta, não decisão
- [ ] Relatório com desvios, script sem ocorrência, dispensas, leitura e perguntas
- [ ] Nenhum arquivo corrigido; a pergunta de quais corrigir ficou com o usuário
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
