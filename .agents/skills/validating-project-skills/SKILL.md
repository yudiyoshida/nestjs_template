---
name: validating-project-skills
description: Confere o catálogo de skills do repositório com um script — frontmatter, tamanho, seções do molde, skill citada que não existe, "planejada" vencida, symlinks em .claude e .cursor, bloco de código aberto e skill fora do roteador — e entrega um relatório do que corrigir, sem editar nada. Use quando o usuário pedir para validar, conferir ou auditar as skills, checar o catálogo, ver se as skills estão consistentes ou linkadas, depois de criar ou editar uma skill, ou validating-project-skills.
---

# Conferência do catálogo de skills

Roda as checagens do catálogo em `.agents/skills` e relata cada problema com o arquivo, a regra e como corrigir.

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o que conferir no catálogo.** Todo o padrão — as checagens, as dispensas, a revisão completa e o relatório — está definido nesta skill: aqui e em `references/checks.sh`.

Antes de conferir, **não**:

- escreva checagem nova na hora nem reescreva as do script
- edite skill
- abra skill vizinha para descobrir regra, fora da revisão completa

Se uma skill contradiz o molde da `creating-project-skills`, é desvio.

**Permitido ler apenas para executar a tarefa:**

- a saída de `references/checks.sh`
- a skill de uma ocorrência marcada "verificar", para decidir se é desvio
- na revisão completa, as skills, para achar contradição entre elas

### Leis

- A skill só lê e relata. Corrigir skill é outro pedido, pelo molde da skill `creating-project-skills`.
- As checagens moram em `references/checks.sh`. Rodar na raiz do repositório, como está.
- Checagem com "verificar" no título é heurística. Dispensa conhecida: skill de operação ou meta, que não gera código, fora do roteador do `create-new-feature`; referência longa que já tem índice no topo.
- Revisão completa, só quando o pedido for revisão completa: além do script, abrir as skills e procurar lei que uma diz e outra contradiz (caminho de arquivo, nome de classe, mensagem), "Fora (sem skill)" para assunto que já tem skill e template que diverge do molde.
- O relatório diz o arquivo, a regra e a correção. A skill não corrige.

### Regra por checagem

| Id | Regra | Correção |
|---|---|---|
| V1 | Pasta com `SKILL.md` e `name` igual à pasta | Renomear a pasta ou o `name` |
| V2 | `description` diz o que faz e depois "Use quando…" | Reescrever a `description` |
| V3 | `SKILL.md` com menos de 500 linhas | Mover o bloco pesado para `references/` |
| V4 | Seções do molde: única fonte da verdade, Fluxo, Quando usar, Quando não usar, Fora do escopo, Checklist de entrega | Acrescentar a seção |
| V5 | Toda skill citada existe | Criar a skill ou trocar a citação |
| V6 | "planejada X" só para X que não existe | Trocar por "Skill `X`" |
| V7 | Cada skill com symlink em `.claude/skills` e `.cursor/skills` para `../../.agents/skills/<kebab>`; sem cópia e sem link órfão | Criar ou refazer o link |
| V8 | Bloco de código fechado | Fechar a cerca |
| V9 | Skill que gera código está no roteador do `create-new-feature` | Linha no roteador, ou dispensa |
| V10 | Referência com mais de 300 linhas tem índice no topo | Acrescentar o índice |

## Fluxo

```
Progresso:
- [ ] 1. Rodar references/checks.sh na raiz do repositório
- [ ] 2. Triar cada ocorrência: confirmada ou dispensada (abrir a skill nas heurísticas)
- [ ] 3. Revisão completa, só se o pedido for revisão completa
- [ ] 4. Escrever o relatório no template
- [ ] 5. Perguntar o que corrigir. A correção é outro pedido, pela creating-project-skills
- [ ] 6. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Skill criada ou editada | Fluxo, passos 1, 2, 4 e 5 |
| Validar, conferir ou auditar o catálogo | Fluxo, passos 1, 2, 4 e 5 |
| Revisão completa das skills | Fluxo inteiro |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Criar ou editar skill | Skill `creating-project-skills` |
| Código fora das leis do template | Skill `auditing-template-conformance` |
| Lint, tipos, testes e build | Skill `verifying-delivery` |

## Templates

```bash
bash .agents/skills/validating-project-skills/references/checks.sh
```

Relatório:

```markdown
## Catálogo de skills

| Id | Arquivo | Problema | Correção |
|---|---|---|---|
| V4 | `.agents/skills/<skill>/SKILL.md` | falta `## Fora do escopo` | Acrescentar a seção |

Sem ocorrência: V1, V2, V3.
Dispensadas: V9 `<skill>` (skill de operação, não gera código).

O que corrijo?
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Correção de skill | Skill `creating-project-skills` |
| Desvio no código | Skill `auditing-template-conformance` |
| Lint, tipos, testes, build | Skill `verifying-delivery` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] `references/checks.sh` rodou como está, na raiz
- [ ] Cada ocorrência triada; dispensa com o motivo
- [ ] Revisão completa só quando pedida
- [ ] Relatório com id, arquivo, problema e correção; checagens sem ocorrência listadas
- [ ] Nenhuma skill editada; a pergunta do que corrigir ficou com o usuário
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
