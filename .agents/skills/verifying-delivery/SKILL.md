---
name: verifying-delivery
description: Confere a entrega antes de declarar pronto — lint e tipos, spec dos arquivos novos, auditoria das leis do template nos arquivos da entrega, testes unitários e de integração, build e collection Postman quando o contrato HTTP mudou — e entrega um relatório do que passou, do que falhou e do que não rodou. Use quando o usuário pedir para verificar, validar ou conferir a entrega, rodar lint, testes, tipos ou build, saber se está pronto para commit ou PR, ou ao fim de qualquer skill que gerou ou mudou código.
---

# Conferência da entrega

Roda os portões do template sobre o que mudou e diz, sem arredondar, o que passou, o que falhou e o que não rodou.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir quais verificações rodar.** Todo o padrão — o que é a entrega, os portões, a ordem, os comandos, o spec esperado de cada arquivo novo, a regra de falha e o relatório — está definido aqui e apenas aqui.

Antes de executar, **não**:

- leia `package.json`, config de lint ou do Jest para descobrir comando
- rode grep/glob para inferir convenção
- abra skill vizinha, salvo a `auditing-template-conformance` no portão da auditoria

Se arquivo existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa:**

- a lista de arquivos da entrega e a saída de cada comando
- o arquivo que um portão acusou, para corrigir
- no portão da auditoria, a skill `auditing-template-conformance` e os arquivos da entrega, pelo fluxo dela
- host, porta e database da `DATABASE_URL` dos dois `.env`, pelo comando da seção "Templates". Proibido imprimir segredo

### Leis

- A entrega é o que o `git status --porcelain --untracked-files=all` mostra: modificado, novo e removido.
- Ordem fixa: lint → tipos → spec presente → auditoria → bancos separados → unitário → integração → build → Postman. Portão vermelho: corrigir e rodar de novo a partir dele.
- Lint só nos `.ts` da entrega dentro de `src/`: `--fix`, depois sem `--fix` até zero erro. A lista vai ao `eslint` por `xargs`: no zsh, `$FILES` sem aspas não se divide e o `eslint` recebe tudo como um caminho só. Lista vazia: o portão não se aplica. Não rodar `eslint` sem arquivo, que sai verde sem checar nada. Não usar `npm run lint` como portão: ele aplica `--fix` em todo o `src/`.
- Tipos no projeto inteiro com `tsc --noEmit`: pega spec, seed e script do Postman, que o build não compila.
- Auditoria pela skill `auditing-template-conformance`, com escopo nos arquivos da entrega: o script e a leitura dos arquivos de produção da entrega. Roda antes dos testes, porque corrigir um desvio mexe em código. Entrega sem arquivo de produção em `src/` ou `prisma/`: o portão não se aplica.
- Desvio novo em arquivo da entrega cuja forma a lei já dá (import, nome, decorator, retorno, caso de spec): corrigir pela skill da linha e rodar os portões de novo a partir do lint. Desvio que muda comportamento, ou pergunta da auditoria sobre fato de produto: reportar e perguntar; a entrega não fica pronta. Desvio "conhecido" do `AGENTS.md`: só relatar.
- Leitura da auditoria parcial (passou de 40 arquivos): o portão fica "parcial" com os módulos que faltam, até a rodada seguinte terminar. Parcial não é verde.
- **Bancos separados antes de qualquer `npm test`.** `.env.test` e `.env.development` com o mesmo host, porta e database: parar. Nenhum teste roda até a skill `running-local-environment` separar os bancos. Teste de integração apaga tabelas, e spec com nome errado roda até no lote unitário.
- Teste roda só por `npm test`, que define `NODE_ENV=test`. Proibido `npx jest` direto: sem `NODE_ENV`, o `ConfigModule` carrega o `.env.development` e o spec de integração apaga o banco de desenvolvimento.
- Unitário: tudo menos `*.integration.spec.ts`, sem banco. Spec desse lote que falha por "Can't reach database" ou que chama `deleteMany` é integração com nome errado: apontar como drift no relatório.
- Integração: só `*.integration.spec.ts`, com o banco de teste. Banco inacessível: preparar pela skill `running-local-environment`. Sem conseguir: "não rodou", com o motivo. Proibido trocar teste de integração por mock.
- Correção: erro de lint ou de tipo em arquivo da entrega, corrigir. Teste vermelho com expectativa errada, corrigir o teste. Bug no código de produção: reportar e perguntar. Proibido mudar código de produção para o teste passar sem confirmação.
- Erro em arquivo que a entrega não tocou: relatar como pré-existente, sem corrigir.
- Arquivo da entrega que o pedido não explica: apontar no relatório.
- Contrato HTTP mudou (controller, DTO de body, query ou resposta, rota nova ou removida): com a API no ar, `postman/swagger.json` sai de `GET /swagger-json` e a collection é regerada pela skill `syncing-postman-collection`. API fora do ar: "não rodou".
- "Pronto" só com todos os portões que se aplicam verdes. Portão que não rodou entra no relatório com o motivo, nunca como verde.

### Spec esperado

| Arquivo novo de produção | Spec |
|---|---|
| Use case, controller, DTO de input ou de query, entidade, factory, value object, decorator, guard, filter, adapter real de vendor | `<arquivo>.spec.ts` |
| DAO ou repository Prisma | `<arquivo>.integration.spec.ts` |
| Use case cujo inventário tem seção de integração | Também `<acao>.service.integration.spec.ts` |
| Read model, output de create, enum, porta, módulo Nest, model Prisma, seed | Nenhum |

Spec faltando: voltar a `inventorying-test-scenarios` e à skill de spec daquele arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Listar a entrega
- [ ] 2. Lint nos .ts da entrega em src/
- [ ] 3. Tipos no projeto inteiro
- [ ] 4. Spec presente para cada arquivo novo que pede spec
- [ ] 5. Auditoria dos arquivos da entrega pela skill auditing-template-conformance
- [ ] 6. Conferir que o banco de teste é outro
- [ ] 7. Testes unitários
- [ ] 8. Testes de integração
- [ ] 9. Build de produção
- [ ] 10. Contrato HTTP mudou: swagger.json e Postman
- [ ] 11. Relatório e checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Fim de skill que gerou ou mudou código | Fluxo inteiro |
| "Verifica", "roda os testes", "está pronto?", antes de commit ou PR | Fluxo inteiro |
| Só um portão nomeado (lint, tipos, auditoria, testes, build) | O portão pedido; os outros entram como "não rodou: fora do pedido" |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Escrever ou estender spec | Skills `inventorying-test-scenarios`, `writing-unit-tests` e `writing-integration-tests` |
| Subir API, banco ou separar o banco de teste | Skill `running-local-environment` |
| Regerar a collection | Skill `syncing-postman-collection` |
| Commit, push ou PR | Fora (sem skill) |
| Auditoria do repositório inteiro ou de um módulo | Skill `auditing-template-conformance` |
| Revisão de arquitetura ou de regra de negócio | Fora (sem skill) |

## Templates

```bash
# 1. a entrega
git status --porcelain --untracked-files=all

# 2. lint: arquivos .ts da entrega em src/, sem os removidos
FILES=$(git status --porcelain --untracked-files=all | grep -vE '^( D|D )' | awk '{print $NF}' | grep -E '^src/.*\.ts$')
[ -n "$FILES" ] && echo "$FILES" | xargs npx eslint --fix && echo "$FILES" | xargs npx eslint

# 3. tipos
npx tsc --noEmit -p tsconfig.json

# 5. auditoria: o script; a triagem e a leitura seguem a skill auditing-template-conformance
bash .agents/skills/auditing-template-conformance/references/checks.sh

# 6. bancos: o database do .env.test tem que ser outro
grep -E '^DATABASE_URL=' .env.development .env.test | sed -E 's#=.*@#=#'

# 7. unitário, sem banco
npm test -- --testPathIgnorePatterns '\.integration\.spec\.ts$'

# 8. integração, com o banco de teste
npm test -- '\.integration\.spec\.ts$'

# 9. build de produção
npm run build

# 10. contrato HTTP mudou, com a API no ar
curl -s http://localhost:<PORT>/swagger-json -o postman/swagger.json
```

Relatório, um portão por linha:

| Portão | Comando | Resultado |
|---|---|---|
| Lint | `npx eslint <arquivos>` | passou · falhou · não se aplica |
| Tipos | `npx tsc --noEmit -p tsconfig.json` | passou · falhou |
| Spec presente | tabela "Spec esperado" | completo · faltou `<arquivo>` |
| Auditoria | skill `auditing-template-conformance`, escopo na entrega | sem desvio novo · corrigido · pergunta aberta · parcial: faltam `<módulos>` · não se aplica |
| Bancos separados | `grep DATABASE_URL` | separados · mesmo banco (testes não rodaram) |
| Unitário | `npm test -- --testPathIgnorePatterns ...` | `<n>` suítes, `<n>` testes · falhou |
| Integração | `npm test -- '\.integration\.spec\.ts$'` | passou · falhou · não rodou: `<motivo>` |
| Build | `npm run build` | passou · falhou |
| Postman | skill `syncing-postman-collection` | regerado · não se aplica · não rodou: `<motivo>` |

Fecha com uma linha: pronto para commit, ou não e por quê.

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Spec que faltou | Skills `inventorying-test-scenarios`, `writing-unit-tests` e `writing-integration-tests` |
| API, banco de teste, `.env` | Skill `running-local-environment` |
| Collection Postman | Skill `syncing-postman-collection` |
| Commit, push, PR | Fora (sem skill) |
| Auditoria fora da entrega (repositório, módulo) | Skill `auditing-template-conformance` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Entrega listada com `--untracked-files=all`
- [ ] Lint só nos `.ts` da entrega em `src/`, zero erro; lista vazia marcada como "não se aplica"; `npm run lint` não usado
- [ ] `tsc --noEmit` sem erro
- [ ] Cada arquivo novo que pede spec tem o spec
- [ ] Auditoria dos arquivos da entrega rodou; desvio novo corrigido ou perguntado; leitura completa, ou "parcial" com os módulos que faltam
- [ ] Bancos conferidos antes de qualquer `npm test`; nenhum teste rodou contra o banco de desenvolvimento
- [ ] Unitário verde; spec com nome errado apontado como drift
- [ ] Integração verde, ou "não rodou" com o motivo
- [ ] Build verde
- [ ] Contrato HTTP mudou: `swagger.json` atualizado e Postman regerado, ou "não rodou" com o motivo
- [ ] Código de produção não mudou para teste passar sem confirmação
- [ ] Relatório com cada portão; "pronto" só com todos os que se aplicam verdes
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
