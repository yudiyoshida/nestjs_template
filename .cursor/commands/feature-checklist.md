# /feature-checklist — Checklist de nova funcionalidade

Use este comando quando precisar **aplicar apenas o checklist** de entrega de uma feature nova ou **revisar um PR / diff** contra esse checklist — sem rodar o pipeline completo do `/nova-feature`.

---

## Skill obrigatória (executar primeiro)

1. Abra e siga **`.cursor/skills/code-reviewer/SKILL.md`** como **primeiro passo** deste comando.
2. Para código deste projeto (NestJS/API/Prisma), carregue também **`.cursor/skills/code-reviewer/references/backend.md`** (e **`database.md`** se houver queries/migrations; **`security.md`** se tocar auth/autorização).
3. A checklist arquitetural abaixo (Rule 10) e a revisão pela skill são **complementares**.

---

## Onde está a regra

1. Abra **`.cursor/rules/architecture.mdc`**.
2. Localize o bloco **`## Rule 10 — Checklist para Nova Funcionalidade`**.
3. **Critério estável de fallback:** use a **última seção `## Rule …` antes de `## Referências`**.
4. Copie mentalmente a **lista de checkbox** daquela seção e trate-a como **fonte única** para esta tarefa.

Não assuma de memória qual é o número da rule; **leia o arquivo** sempre.

---

## Missão do agente

- **Revisão de código (skill):** quando o escopo incluir trechos alterados, aplique o processo de revisão da skill (`code-reviewer`).
- **Checklist (Rule 10):** percorra **cada item** do checklist na ordem em que aparece no arquivo de rules.
- Para cada item, registre: **cumprido**, **não aplicável (com justificativa breve)** ou **faltando / pendente / risco**.
- **Ao final**, consolide tudo na **tabela-resumo obrigatória**.

---

## Relação com outras rules e skills

- O checklist é **subset** das regras gerais: ele não substitui `architecture.mdc` inteiro.
- Para o **roteiro mestre completo**, prefira **`/nova-feature`**.
- Skills pontuais (DAO, Prisma, testes, etc.) só entram se um item do checklist **exigir** detalhe.

---

## Formato obrigatório de entrega

### 1. Revisão de código (skill) — quando houver código no escopo

Incluir a estrutura definida na skill (**Resumo**, **Problemas Encontrados** com severidades, **O que está bem**).

### 2. Análise do checklist (opcional mas recomendada)

Texto ou subtítulos espelhando os bullets do arquivo de rules.

### 3. Resumo final (obrigatório): uma tabela

| Coluna | Conteúdo |
|--------|----------|
| **Etapa** | Nome/descrição curta do item |
| **Situação** | **Cumprida** \| **Não cumprido** \| **Não aplicável** \| **Pendente / risco** |
| **Justificativa** | Motivo breve quando não for Cumprida |

---

## Regras de ouro deste comando

1. **Skill primeiro:** sempre carregar **`.cursor/skills/code-reviewer/SKILL.md`** quando há código.
2. **Fonte única do checklist:** o texto vale o que está **agora** em `.cursor/rules/architecture.mdc`.
3. **`npm run lint`, `npm test`, `npm run build`:** só exija evidência quando o trabalho já deveria estar pronto para CI.
