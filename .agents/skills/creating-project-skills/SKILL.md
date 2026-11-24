---
name: creating-project-skills
description: Cria ou edita skills em .agents/skills com fonte da verdade autocontida, bloco base e references quando o SKILL.md passa de 500 linhas. Use quando o usuário pedir para criar skill, nova skill, editar skill do projeto, ou padronizar uma skill existente.
---

# Creating Project Skills

Molde para criar ou editar uma skill em `.agents/skills/`. Não é skill de domínio Nest. O código que a aplicação executa não mora aqui.

## Esta skill é a única fonte da verdade

**Proibido abrir outra skill ou arquivo de `src/` para descobrir o formato de uma skill.** O molde — seções, fonte da verdade, bloco base, teto de 500 linhas, `references/` — está definido aqui e apenas aqui.

Se uma skill existente contradiz este molde, **este molde vence** na skill nova ou na skill que o usuário pediu para padronizar. Não imite o desvio.

Exceção: o usuário apontar uma skill como referência, ou pedir edição de uma skill que já existe — leia só essa skill, e só para alterar o que ele pediu. O formato continua este.

## Fluxo

```
Progresso:
- [ ] 1. Confirmar que o pedido é skill de autoria em .agents/skills (não código de src/)
- [ ] 2. Escrever SKILL.md pelo esqueleto desta skill
- [ ] 3. Colocar na pasta da skill todo código que ela manda recriar
- [ ] 4. Se SKILL.md passar de 500 linhas, mover o bloco pesado para references/
- [ ] 5. Criar os symlinks em .claude/skills e .cursor/skills (seção "Symlinks")
- [ ] 6. Rodar o checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| Usuário pede criar skill, nova skill, skill do projeto | Skill nova em `.agents/skills/<kebab>/SKILL.md` |
| Usuário pede editar ou padronizar uma skill existente | Ajustar essa pasta; reler só o que for editar |
| `SKILL.md` passou de 500 linhas | `references/<assunto>.md` + ponteiro |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| Implementar VO, erro, config, logger, port, teste | Skill de domínio correspondente |
| Documentação de produto, ADR, README | Fora (sem skill) |
| Skill pessoal fora deste repositório | Fora (sem skill) |

## Autocontenção

O código que a skill manda recriar mora na pasta da skill (`SKILL.md` ou `references/`). Apagar ou mover um arquivo de `src/` não pode quebrar o padrão.

Achar um `export` no repositório serve para **inserir** uma chave ou **reusar** um símbolo que já existe. Sumiu o arquivo → o template da skill recria, no caminho canônico escrito na própria skill.

Proibido como fonte do padrão:

- "veja `src/...`", "copie o arquivo X do projeto", "abra outro `.ts` para aprender o formato"
- abrir skill vizinha para copiar seções
- algoritmo, classe ou template que só existe no repositório e não na pasta da skill

Permitido no texto da skill: caminho de **destino** (`src/core/...`) para onde o arquivo nasce quando o símbolo está ausente. O corpo do arquivo está no template.

## Esqueleto

Pasta: `.agents/skills/<kebab>/SKILL.md`. `name` = nome da pasta. Português. Terceira pessoa.

`description`: o que a skill faz, depois "Use quando…" com os pedidos do usuário. Sem resumir o fluxo interno (passos, checklist).

````markdown
---
name: <kebab>
description: <o que faz>. Use quando o usuário pedir para <gatilhos>.
---

# <Título>

<Uma frase: o que a skill produz.>

## Esta skill é a única fonte da verdade

**Proibido consultar outros arquivos do projeto para descobrir o padrão de <assunto>.** Todo o padrão — <lista curta> — está definido aqui e apenas aqui.

Antes de escrever, **não**:

- leia arquivos existentes para copiar formato
- rode grep/glob para inferir convenção

Se código existente contradiz esta skill, **esta skill vence**.

**Permitido ler apenas para executar a tarefa (não para formato):**

- o que o usuário indicou como entrada
- arquivo que exporta <Símbolo> — só para inserir ou reusar (seção "Bloco base")

Exceção: usuário apontar um arquivo, ou pedir edição de um arquivo que já existe — leia só esse arquivo.

## Fluxo

```
Progresso:
- [ ] 1. <confirmar o caso>
- [ ] 2. Localizar <Símbolo> pelo export (ausente → seção "Bloco base")
- [ ] 3. Escrever seguindo o template
- [ ] 4. Checklist de entrega
```

## Quando usar

| Sintoma | Ação |
|---------|------|
| <pedido> | <o que fazer> |

### Quando não usar

| Situação | Onde vai |
|----------|----------|
| <fora> | Skill `<nome>` ou Fora (sem skill) |

## Bloco base

Só se a skill depende de um símbolo compartilhado. Localizar pela busca do export antes de escrever. Se não existir, criar pelo template abaixo, no destino indicado.

| Símbolo | Localizar por | Destino se ausente |
|---------|---------------|--------------------|
| `<Símbolo>` | `export class <Símbolo>` | `src/<caminho>/<arquivo>.ts` |

```bash
grep -rn "export class <Símbolo>" src
```

```ts
// classe ou objeto completo, suficiente para recriar o arquivo
```

## Templates

Código executável. Import `'<Símbolo>'`: trocar pelo caminho real do arquivo que exporta o símbolo (seção "Bloco base").

```ts
// exemplo completo do artefato que a skill cria
```

## Fora do escopo

| Artefato | Delegar a |
|----------|-----------|
| <outro artefato> | Skill `<nome>` |

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] <item verificável>
- [ ] Nenhum padrão copiado de outros arquivos — apenas esta skill
````

Omitir "Bloco base" quando a skill não localiza símbolo nenhum. O resto permanece.

## Teto de 500 linhas

`SKILL.md` fica com menos de 500 linhas. Regras, fluxo, quando usar, bloco base curto e checklist permanecem nele.

Estourou: mover o bloco pesado (templates longos, exemplo grande, algoritmo) para `references/<assunto>.md`. No `SKILL.md`, no passo do fluxo que escreve aquele bloco, a frase: leia `references/<assunto>.md` antes de escrever X. A referência repete o título e a primeira linha diz quando lê-la.

Referência acima de ~300 linhas: índice no topo com as seções.

Proibido partir a skill só para encurtar texto que cabe. Parte quando o `SKILL.md` passa de 500, ou quando um bloco de código de referência já empurra o arquivo para perto do teto.

## Symlinks

A pasta da skill existe só em `.agents/skills/<kebab>/`. O Claude Code lê `.claude/skills/` e o Cursor lê `.cursor/skills/`: cada um recebe um symlink relativo para a pasta. Proibido copiar a pasta ou o `SKILL.md`, porque a cópia não acompanha a edição.

```bash
ln -s ../../.agents/skills/<kebab> .claude/skills/<kebab>
ln -s ../../.agents/skills/<kebab> .cursor/skills/<kebab>
```

Skill renomeada: apagar os dois links do nome antigo e criar os do nome novo. Skill apagada: apagar os dois links.

## Checklist de entrega

Antes de responder, confirmar **todos**:

- [ ] Pasta `.agents/skills/<kebab>/SKILL.md` com `name` igual à pasta
- [ ] `description` diz o que faz e "Use quando…"; não resume o fluxo
- [ ] Seção "Esta skill é a única fonte da verdade" com a lista do que não ler
- [ ] Fluxo, quando usar, quando não usar, templates com código completo, fora do escopo, checklist
- [ ] Bloco base só se houver símbolo por `export`; template completo para o caso ausente
- [ ] Código que a skill manda recriar está na pasta da skill
- [ ] Nenhum ponteiro manda abrir `src/` ou outra skill para aprender formato ou algoritmo
- [ ] `SKILL.md` com menos de 500 linhas; se havia estouro, `references/` com "leia este arquivo quando for escrever X"
- [ ] Symlinks `.claude/skills/<kebab>` e `.cursor/skills/<kebab>` apontam para `../../.agents/skills/<kebab>`; nenhuma cópia da pasta
- [ ] Texto em português
- [ ] Nenhum formato copiado de outra skill — apenas esta skill
