# /qa-tdd — Testes com TDD + QA sênior

Use este comando quando quiser **gerar ou estender testes** (unit, integration, DTO, DAO, controller, domínio) com **dois trilhos obrigatórios**:

1. **TDD (Test-Driven Development)** — ciclo RED → GREEN → REFACTOR, com evidência de falha antes de "consertar".
2. **QA sênior + padrões do repositório** — matriz exaustiva de cenários, co-locação, `*.spec.ts`, `testing-strategy`, Rule 5 em `architecture.mdc`.

---

## ETAPA 0 — Carregar instruções (OBRIGATÓRIO)

**Antes de qualquer código ou plano detalhado**, leia **na íntegra**:

1. **`.cursor/skills/qa-test-generator/SKILL.md`** — workflow de QA.
2. **`.cursor/skills/testing-strategy/SKILL.md`** — sufixos, `createMock`, `prisma.<model>.deleteMany()`, estrutura canônica dos `describe`/`it`.

**TDD (Superpowers / skill anexada)**  
Se a skill **`test-driven-development`** estiver disponível, **leia-a na íntegra** também.

### Contrato mínimo TDD (resumo executivo)

```
Regra de ferro: SEM CÓDIGO DE PRODUÇÃO NOVO SEM TESTE FALHANDO ANTES.
```

- **RED**: escreva **um** incremento mínimo de teste; rode `npm test -- <filtro>` e **confirme que falha pelo motivo certo**.
- **Só depois do RED comprovado** → **GREEN**: implemente **o mínimo** em produção.
- **REFACTOR**: com tudo verde, limpe duplicação; **rode os testes de novo**.

**Conflitos com o QA generator**  
A matriz é o backlog; **cada linha** entra no ciclo TDD **uma de cada vez**.

---

## ETAPA 1 — Descoberta e escopo

Siga a **Fase 1** do `qa-test-generator` (arquivo alvo, dependências, specs existentes, módulo Prisma quando couber).

---

## ETAPA 2 — Matriz exaustiva (QA)

Siga a **Fase 2** do `qa-test-generator`: tabela de cenários (happy path, boundaries, erros de domínio, persistência, autorização, idempotência, etc.).

Não escreva specs ainda — só a matriz.

---

## ETAPA 3 — Confirmação

Siga a **Fase 3** do `qa-test-generator`: usuário aprova escopo/prioridades.

---

## ETAPA 4 — Implementação com TDD

Para **cada** incremento:

1. **RED** — adicione o(s) teste(s); rode `npm test -- <arquivo.spec>`; capture evidência de falha esperada.
2. **GREEN** — implemente o mínimo.
3. **REFACTOR** — opcional neste incremento.

**Regras do projeto (não negociáveis)**:

- Co-locação, `sut`, `makeValid<X>Input`, `createMock`, `AuthenticationGuardsModule` em controller unit
- Integration com `imports: [<Modulo>Module]` e `beforeEach(() => prisma.<model>.deleteMany())`
- Sem `Promise.all` frágil em integration com unicidade
- Mensagens de assert alinhadas a erros **pt-BR**

---

## ETAPA 5 — Verificação

Siga a **Fase 5** do `qa-test-generator`: `npm test` nos arquivos tocados, `npm run lint` quando houver `.ts` novo/alterado.

**Checklist TDD (obrigatório na mensagem final)**

- [ ] Cada novo comportamento em produção foi precedido de teste falhando.
- [ ] Cada ciclo RED teve execução de teste com falha "certa".
- [ ] Pós-GREEN os testes relevantes passam.

---

## Quando NÃO usar este comando

- **Só checklist de PR** sem escrever testes → use `/feature-checklist`.
- **Feature nova completa** → use `/nova-feature`.

---

## Referências rápidas

| Recurso | Caminho |
|--------|---------|
| QA + matriz + scaffolds | `.cursor/skills/qa-test-generator/SKILL.md` |
| Política de specs do repo | `.cursor/skills/testing-strategy/SKILL.md` |
| Rule 5 (testes) | `.cursor/rules/architecture.mdc` |
| TDD completo (se instalado) | skill **test-driven-development** (Superpowers) |
