---
name: creating-skills
description: Cria, edita, renomeia e remove skills do projeto em .agents/skills no esqueleto padrão (frontmatter, única fonte da verdade, Fluxo, Quando usar, Templates, Fora do escopo, Checklist de entrega), com symlinks em .claude/skills e .cursor/skills, pesquisa de divergências no código e delegação entre skills. Use quando o usuário pedir para criar, escrever, adicionar, editar, revisar, renomear, remover ou padronizar uma skill ou SKILL.md, transformar um padrão do código (use case, DTO, controller, DAO, módulo, teste) em skill, criar uma das skills planejadas no todo.md, ou mudar regra, gatilho, checklist ou delegação de uma skill existente.
---

# Creating Skills

Cria e edita skills do projeto em `.agents/skills/<nome>/SKILL.md`, todas no mesmo esqueleto, com symlinks para Claude Code (`.claude/skills`) e Cursor (`.cursor/skills`).

Neste projeto, feature nova é construída por skills: cada tipo de artefato (use case, DTO, controller, porta de infra…) tem uma skill que é a lei do seu padrão, e as skills delegam umas às outras. Esta skill garante que toda skill nova saia no mesmo formato e que nenhum artefato fique sem dono.

## Esta skill é a única fonte da verdade

**Proibido usar outra skill como modelo de formato.** Frontmatter, seções, ordem, tom, nomes, symlinks e delegação estão definidos aqui e apenas aqui.

Skills existentes não são modelo: várias divergem do esqueleto. Se uma skill existente contradiz esta skill, **esta skill vence** — na skill nova e na seção tocada de uma edição.

Diferente das skills de artefato, **criar skill exige ler código**: o padrão sai do código real e das decisões do usuário, não da memória nem de outra skill.

**Obrigatório ler** (para conteúdo, não para formato):

- `description` e tabelas `Fora do escopo` / `Quando não usar` das skills em `.agents/skills/` — sobreposição e delegações pendentes
- Todas as ocorrências do artefato em `src/` (ou do processo, se a skill for de processo) — padrão e divergências
- Seção de skills do `todo.md` — nome planejado e dependências
- Em edição: a skill alvo inteira

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que vira skill (critérios em "Quando usar") e fixar o nome
- [ ] 2. Ler description e delegações das skills existentes: sobreposição e fronteira
- [ ] 3. Checar todo.md: nome planejado e dependências ainda não criadas
- [ ] 4. Pesquisar o artefato no código: ocorrências e divergências
- [ ] 5. Levar divergências e lacunas ao usuário; registrar cada decisão
- [ ] 6. Escrever o SKILL.md no esqueleto (seção Templates)
- [ ] 7. Criar os symlinks em .claude/skills e .cursor/skills
- [ ] 8. Propagar delegação: linhas "Fora" das outras skills que agora têm dono
- [ ] 9. Rodar o validador; remover a skill da lista do todo.md
- [ ] 10. Checklist de entrega
```

Dependência declarada no `todo.md` ainda não criada (ex.: "depois de creating-controllers") → avisar o usuário antes do passo 4.

Editar, renomear ou remover: seção "Editar, renomear ou remover".

## Quando usar

Skill nova só quando **todos** os critérios valem:

| Critério | Significa |
|----------|-----------|
| Recorrente | O artefato ou processo volta em várias features |
| Padrão definível | Pasta, nome, template e regras que dá para verificar |
| Risco de improviso | Sem guia, o agente copia legado divergente ou inventa formato |
| Fronteira clara | Dá para dizer o que a skill escreve e o que ela delega |

Granularidade:

| Situação | Decisão |
|----------|---------|
| Artefatos sempre criados juntos, com as mesmas regras | Uma skill com templates A/B (ex.: DAO + Repository; model Prisma + seed) |
| Artefatos com gatilho ou momento diferentes | Skills separadas (ex.: controller e decorator `@Swagger`) |
| Regra transversal curta (ex.: modificadores de acesso) | Seção repetida nas skills que geram classe, não skill própria |
| Processo (PRD, techspec, review, loop de tarefas) | Skill de processo: `writing-`, `reviewing-`, `executing-` |
| Pedido cabe numa skill existente | Editar a existente, não criar outra |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Criar o artefato em si (use case, DTO, controller…) | Skill do artefato |
| Refatorar código legado para seguir uma skill | Tarefa separada, só com pedido do usuário |
| Preferência pessoal do usuário sobre conversa ou ferramenta | Memória do agente, não skill |
| Documento para humanos (README, `docs/`) | Fora (sem skill) |
| Conceito que aparece uma vez | Resolver na própria tarefa |

## Estrutura de pastas

```
.agents/skills/<nome>/
  SKILL.md
  references/            # opcional — só se SKILL.md passar de ~500 linhas
    <tema>.md
  scripts/               # opcional — passo determinístico repetido
.claude/skills/<nome> -> ../../.agents/skills/<nome>
.cursor/skills/<nome> -> ../../.agents/skills/<nome>
```

Uma fonte (`.agents`), duas ferramentas lendo por symlink relativo. **Nunca copiar** a pasta: cópia diverge na primeira edição.

Na raiz do repositório:

```bash
ln -s ../../.agents/skills/<nome> .claude/skills/<nome>
ln -s ../../.agents/skills/<nome> .cursor/skills/<nome>
```

Sem `evals/`, workspace ou rascunho dentro de `.agents/`: tudo ali é versionado e lido como skill.

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| Pasta e `name` | gerúndio em inglês + objeto, kebab-case, até 64 caracteres | `creating-value-objects` |
| Verbo `creating-` | gera artefato novo a partir de template | `creating-custom-errors` |
| Verbo `using-` | consome ou estende um bloco que já existe | `using-core-config`, `using-logger` |
| Verbo `writing-` | produz texto: teste, documento, spec | `writing-unit-tests` |
| Outro verbo | só se nenhum dos três descrever a ação | `handling-`, `sending-`, `reviewing-`, `executing-`, `structuring-` |
| Objeto | plural para tipo de artefato; singular para bloco único | `use-cases`, `dtos` / `core-config`, `logger` |
| Título H1 | nome em Title Case, siglas em caixa alta | `# Creating DTOs` |
| Arquivo | `SKILL.md` | — |

Nome planejado no `todo.md` é o nome da skill; mudar só com o usuário.

## Templates

### Frontmatter

Só `name` e `description`. Claude Code e Cursor leem o mesmo arquivo, e campo extra pode não ser suportado por um deles.

```yaml
---
name: creating-value-objects
description: Cria value objects imutáveis e autovalidáveis em src/shared/value-objects ou em domain/value-objects do módulo, com sanitização, invariantes e getter value. Use quando o usuário pedir para criar value object, VO, objeto de valor, encapsular formato (CPF, e-mail, CEP), validar invariante em classe ou eliminar primitivos no domínio.
---
```

Regras da `description`:

- Uma linha, até 1024 caracteres, sem `<` nem `>`.
- Frase 1 — o que a skill produz: artefato, pasta, conceitos-chave.
- Frase 2 — `Use quando o usuário pedir para …`: verbos (criar, adicionar, editar, revisar, padronizar), sinônimos pt/en, jargão do usuário (VO, objeto de valor) e pelo menos um gatilho indireto (situação que precisa da skill sem nomeá-la, como "eliminar primitivos no domínio").
- Generosa nos gatilhos. A description é o único texto visto antes de a skill carregar: gatilho faltando = skill ignorada.
- Nenhuma regra na description; regra vai no corpo.

### Esqueleto do SKILL.md

Ordem fixa. **R** = sempre. **C** = só quando se aplica; remover a seção quando não se aplica.

| Seção | Tipo | Conteúdo |
|-------|------|----------|
| `# <Título>` + intro | R | 1–2 frases: o que produz, onde, com qual mecanismo |
| `## Esta skill é a única fonte da verdade` | R | Proibição de copiar formato, o que pode ler, "esta skill vence", exceção. Skill que exige ler artefatos existentes (ex.: erro equivalente para reusar) separa ler para reuso × copiar formato |
| `## Fluxo` | R | Bloco `Progresso:` com passos `- [ ] N.`; último passo = checklist |
| `## Quando usar` + `### Quando não usar` | R | Critérios; tabela `Situação \| Onde vai` roteando para outras skills |
| `## Estrutura de pastas` | C | Árvore; tabela de destino se houver mais de um |
| `## Nomeação` | C | Tabela `Peça \| Forma \| Exemplo` |
| `## Modificadores de acesso` | C | Texto padrão abaixo, se a skill gera classe TS |
| `## Templates` | C | Linha de estilo + blocos com nomes reais do projeto |
| Seções de regra (`## Regras`, `## Mensagens`, `## Segredos`…) | R | Pelo menos uma; regras verificáveis |
| `## Red flags` | C | Tabela `Desculpa \| Realidade` para tentações comuns |
| `## Fora do escopo` | R | Tabela `Artefato \| Delegar a` |
| `## Checklist de entrega` | R | Itens sim/não; sempre a última seção |

````markdown
---
name: <nome>
description: <O que produz: artefato, pasta, conceitos-chave>. Use quando o usuário pedir para <verbos> <objeto>, <sinônimos pt/en>, <jargão>, ou <gatilho indireto>.
---

# <Título>

<O que a skill produz, onde e com qual mecanismo, em 1 ou 2 frases.>

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de <artefato>.**

Todo o padrão — <pastas, nomes, templates, regras> — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia, abra ou busque outros `<glob do artefato>` para copiar formato
- rode grep/glob por `<trecho característico>`
- copie estilo legado, mesmo que divirja desta skill

Se um <artefato> existente contradiz esta skill, **esta skill vence**.

**Permitido ler** (para executar a tarefa, não para copiar formato):

- `<arquivo>` — só para <inserir X / entender comportamento>

Exceção: usuário apontar um arquivo como referência, ou pedir edição de um <artefato> que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o pedido é <artefato> (não <vizinho A>, não <vizinho B>)
- [ ] 2. <passo>
- [ ] 3. <passo que delega, ex.: spec via writing-unit-tests>
- [ ] N. Checklist de entrega
```

## Quando usar

| Critério | Significa |
|----------|-----------|
| <critério> | <o que significa> |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| <situação vizinha> | Skill `<skill existente>` |
| <situação sem skill> | Fora (sem skill) |

## Estrutura de pastas

```
<árvore>
```

## Nomeação

| Peça | Forma | Exemplo |
|------|-------|---------|
| <peça> | <forma> | `<exemplo real>` |

## Templates

Estilo: indent 2, aspas simples, `semi`, vírgula final em multiline, `else` em nova linha, `async()` sem espaço antes do parêntese.

```ts
<template com nomes reais do projeto>
```

## Regras

- <regra verificável> — <porquê em uma frase, quando não for óbvio>

## Red flags

| Desculpa | Realidade |
|----------|-----------|
| "<tentação comum>" | <por que não, e o que fazer> |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| `<x>.spec.ts` | Skill `writing-unit-tests` (**obrigatório**) |
| <artefato vizinho> | Skill `<skill existente>` |
| <artefato sem skill> | Fora (sem skill) |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] <item sim/não>
- [ ] Nenhum padrão copiado de outros <artefato> do repositório — apenas esta skill
````

### Modificadores de acesso

Skill que gera classe TypeScript inclui este bloco, ajustando a lista de classes:

```markdown
## Modificadores de acesso

**Obrigatório em classe de comportamento** (<service, adapter, controller…>): método, getter, setter e atributo declaram `public`, `private` ou `protected` — inclusive públicos.

**Exceções (sem modificador):**

- `constructor` público — sem a palavra `public`. Parameter properties usam `private readonly` (e `@Inject` quando for token).
- Campos de classe de DTO — a classe descreve só a forma do dado.
```

## Escrita

- pt-BR. Código, caminhos, comandos e nomes de API em inglês, entre crases.
- Texto dirigido ao agente que executa a skill, no imperativo: "Antes de escrever, não: …".
- Frase curta, uma ideia por frase.
- Tabela para decisão (critério → destino); lista para regra; bloco de código para template e comando.
- Negrito só no núcleo: proibição ou obrigação que quebra o padrão se violada. Negrito em tudo = negrito em nada.
- Regra não óbvia leva uma frase de porquê. O agente que entende o motivo acerta o caso que a regra não previu.
- Mesmo termo para a mesma coisa em todas as skills (porta, adapter, DAO, use case, driver) — sem sinônimo rotativo.
- Exemplos com nomes reais do projeto (FAQ, Tip, Account, CEP), compiláveis, com imports `src/...`.
- Checklist: cada regra central tem item. Regra sem item costuma ser esquecida.
- Sem emoji, sem histórico ("antes era…"), sem TODO, sem data.
- Tamanho: alvo abaixo de 500 linhas, porque a skill inteira entra no contexto quando dispara. Passou disso: mover detalhe para `references/<tema>.md` e dizer no SKILL.md quando ler.

## Delegação entre skills

Cada skill escreve só o seu artefato e delega o resto. Assim cada regra vive num lugar só.

- Referência sempre como skill `<nome>`: o agente carrega pelo nome.
- Força na tabela `Fora do escopo`: (**obrigatório**), (**recomendado**) ou sem marca (quando aplicável).
- Skill que ainda não existe: `Fora (sem skill)`. **Nunca** citar skill inexistente como se existisse — o agente tenta carregar e falha. Pode anotar o nome planejado: `Fora (sem skill; planejada creating-dtos)`.
- `Quando não usar` roteia **pedidos** (situação → skill ou lugar certo). `Fora do escopo` lista **artefatos vizinhos** que a skill não escreve. O mesmo item pode aparecer nas duas tabelas.

Delegações recorrentes (skills que já existem):

| Precisa de | Delegar a |
|------------|-----------|
| Classe de erro | Skill `creating-custom-errors` |
| Value object | Skill `creating-value-objects` |
| Variável de ambiente | Skill `using-core-config` |
| Log | Skill `using-logger` |
| Porta de infra / vendor externo | Skill `using-ports-and-adapters` |
| Teste unitário | Skill `writing-unit-tests` |

Demais skills: `grep -h '^description:' .agents/skills/*/SKILL.md`.

**Propagação (passo 8).** A skill nova assume artefatos que outras skills marcavam como sem dono:

```bash
grep -n "Fora" .agents/skills/*/SKILL.md
```

Linha cujo artefato agora é da skill nova → trocar o destino por skill `<nome>`, com a força certa. Vale também para as tabelas `Quando não usar`. Não mexer no resto dessas skills.

## Divergências no código

O código deste template tem padrões concorrentes para o mesmo artefato. A skill escolhe um, e a escolha se repete em toda feature futura. Por isso **escolha silenciosa é proibida**.

1. Listar todas as ocorrências: `find src -name '*.<sufixo>.ts'` ou `grep -rln '<marcador>' src`.
2. Comparar por dimensão: pasta, nome de arquivo, nome de classe, métodos e assinatura, injeção, retorno, erros, Swagger, testes.
3. Mostrar ao usuário cada divergência com as variantes, os arquivos de cada uma e a recomendação com porquê.
4. Uma pergunta por divergência, recomendação primeiro. Lacuna que o código não responde (padrão novo) também vira pergunta.
5. Resposta vira regra na skill. Código legado fica como está — a skill vence; refatoração só com pedido.

Formato da pergunta:

```
Divergência: buscar por id sem resultado
- A: lança NotFound — find-faq-by-id.service.ts
- B: devolve null — find-tip-by-id.service.ts
Recomendação: A — o Swagger das duas rotas já declara 404 e o cliente não precisa tratar null.
```

Sem como perguntar (execução autônoma): escrever a recomendação como regra e listar a decisão como pendente na resposta ao usuário.

## Editar, renomear ou remover

| Operação | Passos |
|----------|--------|
| Editar | Ler a skill alvo inteira; mudar só o pedido; regra nova → item novo no checklist; regra removida → item removido; seção tocada alinhada ao esqueleto; delegação mudou → propagar |
| Renomear | `git mv` da pasta; atualizar `name` e H1; recriar os 2 symlinks; `grep -rn "<nome-antigo>" .agents todo.md` e atualizar cada referência |
| Remover | Confirmar com o usuário antes; apagar a pasta e os 2 symlinks; referências nas outras skills viram `Fora (sem skill)` |

Todas as operações terminam com o validador.

## Validação

```bash
node .agents/skills/creating-skills/scripts/validate-skill.mjs <nome>
node .agents/skills/creating-skills/scripts/validate-skill.mjs --all
```

Confere:

- nome em gerúndio-kebab
- frontmatter só com `name` e `description`; `name` igual à pasta; description em uma linha, até 1024 caracteres, com "Use quando" e sem `<`/`>`
- H1 igual ao nome
- "Esta skill é a única fonte da verdade" como primeira seção
- seções obrigatórias na ordem; checklist por último
- `Progresso:` no Fluxo; tabela `Artefato | Delegar a`; pelo menos 3 itens no checklist
- referência só a skill existente
- symlinks relativos resolvendo
- aviso acima de 500 linhas

Erro → corrigir e rodar de novo. Skill legada pode falhar em seções: numa edição, não introduzir erro novo; alinhar o resto só com pedido.

O validador confere formato, não qualidade. O teste de verdade é a primeira tarefa real: sugerir ao usuário usar a skill nova numa sessão nova e ajustá-la pelo que sair errado.

## Red flags

| Desculpa | Realidade |
|----------|-----------|
| "Copio a estrutura da skill mais parecida" | Skills existentes divergem entre si. Esqueleto desta skill. |
| "Já conheço o padrão; pulo a pesquisa" | Memória desatualiza. O código atual decide, e o usuário decide as divergências. |
| "O código faz dos dois jeitos; fico com o mais comum" | Pergunte. A escolha vira regra em toda feature. |
| "Cito a skill planejada; ela vai existir" | O agente tenta carregar e falha. `Fora (sem skill)`. |
| "Copio a pasta para `.claude/skills`" | Cópia diverge. Symlink relativo. |
| "Description curta basta" | É o único texto visto antes de carregar. Gatilho faltando = skill ignorada. |
| "Item de checklist: código limpo" | Item tem que ser sim/não verificável. |
| "Aproveito e refatoro o legado" | Fora do escopo. Só com pedido. |
| "A skill fica mais completa com tudo junto" | Uma skill, um artefato (ou um processo). O resto delega. |

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| Artefato que a skill padroniza (use case, DTO…) | Skill do artefato, depois de criada |
| Refatorar código legado para seguir a skill nova | Fora (sem skill) — só com pedido do usuário |
| Alinhar skills legadas inteiras ao esqueleto | Fora (sem skill) — só com pedido |
| Evals formais (subagentes, benchmark) | Fora (sem skill) — só com pedido |
| Commit | Só com pedido; mensagem `feat: add <nome> skill for <propósito>` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Skill justificada: recorrente, padrão definível, risco de improviso, fronteira clara, sem sobreposição
- [ ] Nome gerúndio-kebab; pasta = `name`; H1 = nome em Title Case
- [ ] Frontmatter só com `name` e `description`; description em uma linha, com "Use quando" e gatilhos pt/en
- [ ] Seções na ordem do esqueleto; condicionais sem uso removidas; checklist por último
- [ ] "Esta skill é a única fonte da verdade" presente como primeira seção (em skill de reuso, separando ler para reuso × copiar formato)
- [ ] Fluxo com `Progresso:`, passos numerados, último passo = checklist
- [ ] Divergências e lacunas levadas ao usuário; cada decisão virou regra (ou ficou listada como pendente)
- [ ] Templates com nomes reais do projeto e estilo do ESLint
- [ ] `Fora do escopo` em tabela `Artefato | Delegar a`; só skill existente; resto `Fora (sem skill)`
- [ ] Propagação feita nas outras skills (linhas `Fora` e `Quando não usar` do artefato)
- [ ] Checklist da skill nova com itens sim/não, um por regra central
- [ ] Symlinks relativos em `.claude/skills` e `.cursor/skills` resolvendo
- [ ] Validador sem erro
- [ ] Skill removida da lista do `todo.md` (se estava lá)
- [ ] Nenhum formato copiado de skill existente — apenas esta skill
